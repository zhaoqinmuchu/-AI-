"""Optional FastAPI adapter for the portfolio project.

The primary demo runs on Node.js so it works in the current environment. This
module exposes the same small HTTP contract for environments that already have
Python and FastAPI installed.
"""

from datetime import date, datetime, timezone
import os
import re
from typing import Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

app = FastAPI(title="Enterprise AI Workbench API", version="0.2.0")


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Keep validation failures aligned with the Node adapter's 400 contract."""
    return JSONResponse(status_code=400, content={"error": "请求参数校验失败", "details": exc.errors()})


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Expose application errors as {error, details}, like the Node adapter."""
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return JSONResponse(status_code=exc.status_code, content={"error": str(exc.detail)})


class AskRequest(BaseModel):
    question: str = Field(min_length=1)


class EngineeringReviewRequest(BaseModel):
    text: str = Field(min_length=1)


class DocumentImportRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    type: str = Field(default="导入文档", max_length=80)
    content: str = Field(min_length=1, max_length=200_000)
    fileName: str = ""
    updatedAt: str = date.today().isoformat()


class CalculationRequest(BaseModel):
    type: Literal["expense", "progress"] = "expense"
    amount: float | None = None
    limit: float = 450
    completed: float | None = None
    total: float | None = None


DOCUMENTS = [
    {
        "id": "expense-policy",
        "title": "差旅与费用报销制度",
        "type": "制度",
        "updatedAt": "2026-10-18",
        "content": "员工出差应提前提交出差申请。国内出差住宿标准为一线城市每晚 450 元，其他城市每晚 350 元。超过标准的费用需要部门负责人审批。报销材料包括发票、行程单和审批记录。",
    },
    {
        "id": "leave-process",
        "title": "员工请假流程说明",
        "type": "流程",
        "updatedAt": "2026-10-12",
        "content": "员工请假需要在系统中提交申请。1 天以内由直属主管审批，超过 1 天由部门负责人审批，超过 5 天还需要人力资源部门复核。病假申请需要上传医疗证明。",
    },
    {
        "id": "customer-onboarding",
        "title": "客户项目上线检查清单",
        "type": "项目交付",
        "updatedAt": "2026-10-25",
        "content": "项目上线前需要确认账号权限、知识库文档、模型配置、接口地址、超时设置和回滚方案。交付工程师需要完成一轮问答测试，并记录无法回答的问题。客户验收时需要演示核心流程并提交部署说明。",
    },
    {
        "id": "engineering-project-brief",
        "title": "工程项目技术交底摘要",
        "type": "工程文档",
        "updatedAt": "2026-10-28",
        "content": "项目名称：滨江办公楼改造项目。计划开工日期：2026-11-10。计划竣工日期：2027-04-30。项目负责人：李工。关键节点包括施工准备、主体结构复核、机电安装、竣工验收。所有设计变更必须形成书面记录。",
    },
    {
        "id": "engineering-safety-checklist",
        "title": "施工现场安全检查清单",
        "type": "安全检查",
        "updatedAt": "2026-10-26",
        "content": "安全检查应覆盖临边洞口防护、临时用电、脚手架、起重设备、消防通道和人员安全教育。发现重大隐患时应立即停止相关作业，指定责任人和整改期限。",
    },
    {
        "id": "engineering-contract-clause",
        "title": "工程合同验收与付款条款",
        "type": "合同条款",
        "updatedAt": "2026-10-22",
        "content": "阶段性付款应以合同约定的验收节点为依据。承包方提交验收资料后，项目管理方应完成资料核验、现场检查和问题闭环。未完成整改或缺少签字确认时，不应直接形成最终验收结论。涉及金额、工期或范围的变更需要履行审批流程。",
    },
]


def tokenize(text: str):
    chunks = re.findall(r"[\u4e00-\u9fff]+|[A-Za-z0-9_]+", text.lower())
    tokens = []
    for chunk in chunks:
        if re.fullmatch(r"[A-Za-z0-9_]+", chunk):
            tokens.append(chunk)
            continue
        tokens.extend(chunk[index:index + 2] for index in range(len(chunk) - 1))
    return set(tokens)


def find_documents(query: str):
    tokens = tokenize(query)
    matches = []
    for document in DOCUMENTS:
        score = sum(1 for token in tokens if token in document["content"] or token in document["title"])
        if any(word in query for word in ("安全", "隐患", "临边", "脚手架", "临时用电")) and document["id"] == "engineering-safety-checklist":
            score += 5
        if any(word in query for word in ("项目", "负责人", "竣工", "变更", "开工")) and document["id"] == "engineering-project-brief":
            score += 5
        if any(word in query for word in ("付款", "合同", "验收", "签字")) and document["id"] == "engineering-contract-clause":
            score += 5
        if any(word in query for word in ("出差", "住宿", "报销", "发票")) and document["id"] == "expense-policy":
            score += 5
        if any(word in query for word in ("请假", "病假", "休假", "医疗")) and document["id"] == "leave-process":
            score += 5
        if any(word in query for word in ("上线", "接口", "回滚", "权限", "知识库")) and document["id"] == "customer-onboarding":
            score += 5
        if score:
            matches.append((score, document))
    return [document for _, document in sorted(matches, key=lambda item: item[0], reverse=True)[:3]]


def first_match(text: str, patterns: list[str]) -> str:
    for pattern in patterns:
        match = re.search(pattern, text)
        if match and match.group(1):
            return match.group(1).strip()
    return ""


@app.get("/api/health")
def health():
    return {
        "ok": True,
        "provider": {
            "mode": "fastapi",
            "ollamaModel": os.getenv("OLLAMA_MODEL", "qwen2.5:1.5b"),
            "difyConfigured": bool(os.getenv("DIFY_BASE_URL") and os.getenv("DIFY_API_KEY")),
        },
        "timestamp": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    }


@app.get("/api/documents")
def documents():
    return {"documents": [{key: value for key, value in document.items() if key != "content"} for document in DOCUMENTS]}


@app.get("/api/documents/import")
def import_capabilities():
    return {"supported": {"text": [".md", ".markdown", ".txt"], "pdf": "需要先提取文字后导入；当前无第三方 PDF 解析依赖"}}


@app.post("/api/documents/import", status_code=201)
def import_document(request: DocumentImportRequest):
    if request.fileName.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail={
                "error": "当前接口不直接解析 PDF。请先提取 PDF 文字，再以 Markdown 或纯文本提交。",
                "details": {
                    "field": "fileName",
                    "supported": {"text": [".md", ".markdown", ".txt"], "pdf": "需要先提取文字后导入；当前无第三方 PDF 解析依赖"},
                },
            },
        )
    if request.fileName and not request.fileName.lower().endswith((".md", ".markdown", ".txt")):
        raise HTTPException(status_code=400, detail="只支持 .md、.markdown 和 .txt 文件")
    document = {
        "id": f"imported-{len(DOCUMENTS) + 1}",
        "title": request.title.strip(),
        "type": request.type.strip() or "导入文档",
        "updatedAt": request.updatedAt,
        "content": request.content.strip(),
    }
    if not document["content"]:
        raise HTTPException(status_code=400, detail="content 不能为空")
    DOCUMENTS.append(document)
    return {"document": document}


@app.post("/api/ask")
def ask(request: AskRequest):
    matches = find_documents(request.question)
    evidence = [
        {
            "index": index + 1,
            "documentId": item["id"],
            "title": item["title"],
            "type": item["type"],
            "updatedAt": item["updatedAt"],
            "excerpt": item["content"],
        }
        for index, item in enumerate(matches)
    ]
    trace = ["接收问题", f"检索知识库：命中 {len(matches)} 条", "使用 FastAPI 演示回答器", "整理引用和人工复核提示"]
    if not matches:
        return {
            "answer": "当前知识库没有找到足够依据。建议补充相关制度或把问题交给人工处理。",
            "confidence": "low",
            "needsHumanReview": True,
            "evidence": [],
            "trace": trace,
        }
    return {
        "answer": f"根据知识库，问题“{request.question}”可先参考：{matches[0]['content']}",
        "confidence": "medium",
        "needsHumanReview": False,
        "evidence": evidence,
        "trace": trace,
    }


@app.post("/api/workflow/extract")
def workflow_extract(request: EngineeringReviewRequest):
    text = request.text
    amount_match = re.search(r"(?:金额|费用|预算)[：:]?\s*(\d+(?:\.\d+)?)\s*(元|万元)?", text)
    city_match = re.search(r"(?:城市|地点|出差地)[：:]?\s*([\u4e00-\u9fff]{2,8})", text)
    purpose_match = re.search(r"(?:事由|目的|用途)[：:]?\s*([^。\n]+)", text)
    amount = f"{amount_match.group(1)}{amount_match.group(2) or '元'}" if amount_match else ""
    needs_review = (amount_match and float(amount_match.group(1)) > 450) or "隐患" in text
    return {"fields": {"amount": amount, "city": city_match.group(1) if city_match else "", "purpose": purpose_match.group(1).strip() if purpose_match else "", "reviewStatus": "需要人工复核" if needs_review else "可以进入常规审批"}}


@app.post("/api/engineering/review")
def engineering_review(request: EngineeringReviewRequest):
    matches = [document for document in find_documents(request.text) if document["id"].startswith("engineering-")]
    risks = []
    if any(word in request.text for word in ("安全", "隐患", "临边", "脚手架")):
        risks.append("涉及现场安全，必须由专业人员现场确认")
    if any(word in request.text for word in ("付款", "合同", "验收", "变更")):
        risks.append("涉及合同或验收结论，需要核对签字和审批记录")
    fields = {
        "projectName": first_match(request.text, [r"项目名称[：:]\s*([^\n。]+)"]),
        "owner": first_match(request.text, [r"负责人[：:]\s*([^\n。]+)"]),
        "dueDate": first_match(request.text, [r"(?:截止日期|竣工日期|完成日期)[：:]\s*([0-9]{4}[-年][0-9]{1,2}[-月][0-9]{1,2}日?)"]),
        "issue": first_match(request.text, [r"(?:问题|隐患|事项)[：:]\s*([^\n。]+)"]),
    }
    return {
        "summary": "已生成工程问题初步审查结果。" if matches else "当前知识库没有足够依据。",
        "fields": fields,
        "evidence": [{"index": index + 1, "documentId": item["id"], "title": item["title"], "type": item["type"], "updatedAt": item["updatedAt"], "excerpt": item["content"]} for index, item in enumerate(matches)],
        "riskFlags": risks,
        "reviewStatus": "human_review" if risks else ("pass" if matches else "insufficient_evidence"),
        "trace": ["接收工程问题", f"检索工程文档：命中 {len(matches)} 条", "输出人工复核提示" if risks else "输出初步摘要"],
    }


@app.post("/api/tools/calculate")
def calculate(request: CalculationRequest):
    if request.type == "expense":
        if request.amount is None:
            raise HTTPException(status_code=400, detail="amount 不能为空")
        return {"type": "expense", "amount": request.amount, "limit": request.limit, "difference": request.amount - request.limit, "overBudget": request.amount > request.limit, "reviewStatus": "human_review" if request.amount > request.limit else "pass"}
    if request.completed is None or request.total is None or request.total <= 0:
        raise HTTPException(status_code=400, detail="completed 和 total 必须是有效数字")
    return {"type": "progress", "completed": request.completed, "total": request.total, "percentage": round(request.completed / request.total * 100, 2), "reviewStatus": "human_review" if request.completed > request.total else "pass"}
