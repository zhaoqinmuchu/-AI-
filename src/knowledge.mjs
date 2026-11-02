import { normalizeDocumentInput } from './document-import.mjs';

export const documents = [
  {
    id: 'expense-policy',
    title: '差旅与费用报销制度',
    type: '制度',
    updatedAt: '2026-10-18',
    content: '员工出差应提前提交出差申请。国内出差住宿标准为一线城市每晚 450 元，其他城市每晚 350 元。超过标准的费用需要部门负责人审批。报销材料包括发票、行程单和审批记录。'
  },
  {
    id: 'leave-process',
    title: '员工请假流程说明',
    type: '流程',
    updatedAt: '2026-10-12',
    content: '员工请假需要在系统中提交申请。1 天以内由直属主管审批，超过 1 天由部门负责人审批，超过 5 天还需要人力资源部门复核。病假申请需要上传医疗证明。'
  },
  {
    id: 'customer-onboarding',
    title: '客户项目上线检查清单',
    type: '项目交付',
    updatedAt: '2026-10-25',
    content: '项目上线前需要确认账号权限、知识库文档、模型配置、接口地址、超时设置和回滚方案。交付工程师需要完成一轮问答测试，并记录无法回答的问题。客户验收时需要演示核心流程并提交部署说明。'
  },
  {
    id: 'engineering-project-brief',
    title: '工程项目技术交底摘要',
    type: '工程文档',
    updatedAt: '2026-10-28',
    content: '项目名称：滨江办公楼改造项目。计划开工日期：2026-11-10。计划竣工日期：2027-04-30。项目负责人：李工。关键节点包括施工准备、主体结构复核、机电安装、竣工验收。所有设计变更必须形成书面记录，并由建设、设计、监理和施工相关人员确认。'
  },
  {
    id: 'engineering-safety-checklist',
    title: '施工现场安全检查清单',
    type: '安全检查',
    updatedAt: '2026-10-26',
    content: '安全检查应覆盖临边洞口防护、临时用电、脚手架、起重设备、消防通道和人员安全教育。发现重大隐患时应立即停止相关作业，指定责任人和整改期限，整改完成后由复核人员确认。系统生成的风险提示只能作为辅助依据，不能替代现场检查和专业人员签字。'
  },
  {
    id: 'engineering-contract-clause',
    title: '工程合同验收与付款条款',
    type: '合同条款',
    updatedAt: '2026-10-22',
    content: '阶段性付款应以合同约定的验收节点为依据。承包方提交验收资料后，项目管理方应完成资料核验、现场检查和问题闭环。未完成整改或缺少签字确认时，不应直接形成最终验收结论。涉及金额、工期或范围的变更需要履行审批流程。'
  }
];

const stopWords = new Set(['什么', '如何', '可以', '需要', '以及', '请问', '一下', '公司', '员工', '超过', '标准', '怎么办', '多少', '审批']);

function tokenize(text) {
  const chunks = text.match(/[\u4e00-\u9fa5]+|[a-zA-Z0-9_]+/g) ?? [];
  const tokens = [];
  for (const chunk of chunks) {
    if (/^[a-zA-Z0-9_]+$/.test(chunk)) {
      tokens.push(chunk.toLowerCase());
      continue;
    }
    for (let index = 0; index < chunk.length - 1; index += 1) {
      tokens.push(chunk.slice(index, index + 2));
    }
  }
  return [...new Set(tokens.filter((token) => !stopWords.has(token)))];
}

export function searchDocuments(query, limit = 3) {
  const queryTokens = tokenize(query);

  return documents
    .map((document) => {
      const haystack = `${document.title} ${document.type} ${document.content}`.toLowerCase();
      const matchedTokens = queryTokens.filter((token) => haystack.includes(token));
      let score = matchedTokens.length;
      if (document.id === 'expense-policy' && /出差|住宿|报销|发票/.test(query)) score += 5;
      if (document.id === 'leave-process' && /请假|病假|医疗|休假/.test(query)) score += 5;
      if (document.id === 'customer-onboarding' && /上线|项目|接口|回滚|验收/.test(query)) score += 5;
      return { ...document, score, matchedTokens };
    })
    .filter((document) => document.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export function buildEvidence(results) {
  return results.map((document, index) => ({
    index: index + 1,
    documentId: document.id,
    title: document.title,
    type: document.type,
    updatedAt: document.updatedAt,
    excerpt: document.content
  }));
}

export function buildMockAnswer(question, results) {
  if (results.length === 0) {
    return { answer: '当前知识库没有找到足够依据。建议补充相关制度或把问题交给人工处理。', confidence: 'low', needsHumanReview: true };
  }

  const evidence = results.map((result, index) => `【${index + 1}】${result.title}：${result.content}`).join('\n');
  return {
    answer: `根据当前知识库，问题“${question}”可以先参考以下内容：\n\n${evidence}\n\n如果要形成正式审批结论，还需要结合具体人员、城市和审批记录进行确认。`,
    confidence: results[0].score >= 2 ? 'high' : 'medium',
    needsHumanReview: false
  };
}

export function extractWorkflowFields(text) {
  const amount = text.match(/(?:金额|费用|预算)[：:]?\s*(\d+(?:\.\d+)?)\s*(元|万元)?/i);
  const city = text.match(/(?:城市|地点|出差地)[：:]?\s*([\u4e00-\u9fa5]{2,8})/);
  const purpose = text.match(/(?:事由|目的|用途)[：:]?\s*([^。\n]+)/);

  return {
    amount: amount ? `${amount[1]}${amount[2] ?? '元'}` : '',
    city: city?.[1] ?? '',
    purpose: purpose?.[1]?.trim() ?? '',
    reviewStatus: amount && Number(amount[1]) > 450 ? '需要人工复核' : '可以进入常规审批'
  };
}

export function addDocument(input) {
  const { title, type, content, updatedAt } = normalizeDocumentInput(input);
  const document = {
    id: `imported-${Date.now()}`,
    title,
    type,
    updatedAt,
    content
  };
  documents.push(document);
  return document;
}
