# 企业 AI 工作台

这是一个面向 AI 应用开发、Agent 实施和交付岗位的作品集项目。它把企业知识库问答、引用依据、流程字段提取和执行轨迹放在同一个可运行工作台里。

## 当前能力

- 知识库问答：按问题检索制度、流程和项目交付文档。
- 引用依据：回答展示命中文档和更新时间。
- 人工复核：没有足够依据时，不强行生成确定结论。
- 工作流抽取：从自然语言申请内容中提取城市、事由、费用和审核状态。
- 工程审查：对工程项目文档、技术交底和安全问题生成摘要、依据、风险标记和人工复核状态。
- 工具调用：支持费用超标判断和工程进度完成率计算。
- 文档导入：支持通过 API 或页面导入 Markdown / 纯文本；PDF 可先提取文字后导入。
- 服务适配：默认使用演示回答器；可以通过环境变量接入 Ollama 或 Dify。
- 可观察性：前端展示检索、模型调用和回退步骤，便于交付和排错。

## 启动

需要 Node.js 18 或更高版本。

```powershell
npm start
```

然后打开 `http://127.0.0.1:3000`。如果 3000 端口被占用，可以使用 `$env:PORT = '3001'` 后再启动。

## 接入 Ollama

先确保 Ollama 服务已经运行，再使用：

```powershell
$env:USE_OLLAMA = 'true'
$env:OLLAMA_MODEL = 'qwen2.5:1.5b'
npm start
```

如果 Ollama 请求失败，系统会自动回退到演示回答器，并在执行轨迹中记录原因。

## 接入 Dify

```powershell
$env:DIFY_BASE_URL = 'http://127.0.0.1/v1'
$env:DIFY_API_KEY = '替换成你自己的密钥'
npm start
```

不要把真实 API Key 写入代码或提交到 Git。Dify 适配器使用 `/chat-messages` 接口，当前版本只保留最小的 blocking 请求流程。

## 测试

```powershell
npm test
```

测试覆盖知识库检索、无依据时的人工复核、以及费用字段提取和超标判断。

当前测试还覆盖工程安全问题的人工复核、工程知识库无依据时的拒答，以及费用和工程进度工具调用。

## 可选 FastAPI 适配

主演示仍使用 Node.js，但当前工作区已经发现可用的 Python 3.14 虚拟环境 `.venv`。`python_api/main.py` 提供同一组 HTTP 接口的 FastAPI 版本，可以启动：

```powershell
.venv\Scripts\python.exe -m pip install -r python_api/requirements.txt
.venv\Scripts\python.exe -m uvicorn python_api.main:app --reload --port 8000
```

FastAPI 版本包含 `/api/health`、`/api/documents`、`/api/ask`、`/api/workflow/extract`、`/api/engineering/review` 和 `/api/tools/calculate`。

当前已用工作区 `.venv` 在 8010 端口完成启动和接口烟测。系统 `python` 命令如果仍指向 Windows 商店别名，请始终使用 `.venv\Scripts\python.exe`。

## Docker 验证状态

Docker Desktop 4.97.0、Docker 29.9.2 和 Compose v5.6.1 已安装并验证 Linux Engine 正常运行。主 Compose 文件已经通过配置检查，项目 app 镜像也可以构建。

主 Compose 的 Ollama 镜像下载受当前网络速度影响，完整的 app + Ollama 容器启动仍待镜像拉取完成。训练和演示可以使用 `ops/docker-compose.host-ollama.yml` 作为备用验证配置：它已经验证了容器健康检查和容器调用本机 `qwen2.5:1.5b` 的真实问答。

容器部署时服务必须监听 `0.0.0.0`。项目通过 `HOST` 环境变量处理：本地默认 `127.0.0.1`，Docker 默认 `0.0.0.0`。

## 新窗口交接

开始新的工作窗口时，先阅读 `docs/交接-2026-11-03.md`，然后根据当前角色读取对应的 `agents/*/AGENTS.md`。

## Git 发布

当前项目使用独立 Git 仓库管理。主项目和新窗口 worktree 的关系、分支名称、验证状态和继续工作的方式，见 `docs/交接-2026-11-03.md`。

## 工程场景说明

工程审查模块使用土木工程文档和流程理解作为场景优势，不声称具备 CAD API 或工业软件二次开发能力。它展示的是跨行业 AI 应用落地能力：文档检索、风险识别、结构化输出、工具调用和人工复核。

评测问题位于 `docs/evaluation-set.json`，包含工程文档、安全、合同、知识库问答、拒答和交付可观察性场景。

## 面试演示顺序

1. 先展示知识库问答和引用依据。
2. 输入一个知识库中没有的问题，展示系统如何转人工复核。
3. 打开“流程抽取”，展示自然语言到结构化字段的转换。
4. 点击“检查服务”，说明当前可切换演示模式、Ollama 和 Dify。
5. 打开执行轨迹，解释检索、模型调用、回退和交付排错流程。
# 企业 AI 工作台

这是一个面向 AI 应用实施、Agent 交付和企业知识库场景的作品集项目。

## 先看这几份资料

- [AI 应用实施与 Agent 交付教材](docs/教材-ai应用实施与交付.md)
- [教材练习与验收清单](docs/教材练习与验收清单.md)
- [学习目标与掌握清单](docs/学习目标与掌握清单.md)
- [学习进度记录](docs/学习进度记录.md)
- [案例教学脚本](docs/案例教学脚本.md)
- [双窗口同步机制](docs/双窗口同步机制.md)
- [动态技能进入规则](docs/动态技能进入规则.md)
- [Python 学习路线](docs/python学习路线.md)
- [总控窗口规则](agents/coordinator/AGENTS.md)
- [总控周度检查表](outputs/sync/coordinator-checklist.md)
- [项目总状态](outputs/sync/project-status.md)
- [接口示例](docs/api-examples.md)
- [岗位匹配卡](outputs/job-matching-cards.md)
- [项目案例说明](outputs/portfolio-case-study.md)

## 快速开始

```powershell
npm test
npm run evaluate
npm start
```

默认访问：`http://127.0.0.1:3000`

## 当前能力

- 企业制度、流程和工程文档知识库；
- 引用依据和无依据转人工；
- 结构化字段抽取；
- 工程安全、合同和验收审查；
- 费用和项目进度工具调用；
- Ollama 和 Dify 适配；
- Markdown/纯文本导入和输入校验；
- 20 条离线评测；
- Docker Compose 配置。

PDF 当前会返回明确的解析边界，要求先提取文字再导入。
