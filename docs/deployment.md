# 部署与排错说明

## Node.js 演示服务

```powershell
npm test
npm start
```

默认地址：`http://127.0.0.1:3000`

服务监听地址由 `HOST` 控制。本地运行默认使用 `127.0.0.1`；容器运行由 Dockerfile 和 Compose 设置为 `0.0.0.0`，保证端口映射可以从宿主机访问。

## Python/FastAPI 适配层

当前工作区已经存在可用的 `.venv`。系统 `python` 命令可能仍指向 Windows 商店占位入口，因此优先使用虚拟环境的完整路径：

```powershell
.venv\Scripts\python.exe --version
.venv\Scripts\python.exe -m compileall python_api
.venv\Scripts\python.exe -m uvicorn python_api.main:app --host 127.0.0.1 --port 8000
```

FastAPI 已使用工作区 `.venv` 在 8010 端口完成启动和逐接口烟测。8000 端口在本机曾出现地址占用，因此实际启动时如果 8000 被占用，可以改用 8010、8002 或其他空闲端口。

如果端口被占用：

```powershell
$env:PORT = '3001'
npm start
```

## Ollama

```powershell
$env:USE_OLLAMA = 'true'
$env:OLLAMA_MODEL = 'qwen2.5:1.5b'
npm start
```

检查 Ollama：

```powershell
ollama list
ollama ps
```

如果模型调用失败，应用会回退到演示回答器，并把失败原因写进执行轨迹。面试演示时需要说明：回退保证了流程可观察，但不代表模型服务本身已经修好。

## Dify

```powershell
$env:DIFY_BASE_URL = 'http://127.0.0.1/v1'
$env:DIFY_API_KEY = 'your-key'
npm start
```

不要把真实 API Key 写入源码、文档或 Git。确认 Dify 应用的 `/chat-messages` 接口、模型配置和网络地址可用。

本机 Dify 控制台/API 地址已验证可达；没有 Bearer API Key 时，`/v1/chat-messages` 返回 401。拿到 Dify 应用 Key 后再做完整回答联调。

## 常见排错顺序

1. 先访问 `/api/health`，确认服务是否启动。
2. 再访问 `/api/documents`，确认知识库是否加载。
3. 用问答页面测试演示模式，排除前端问题。
4. 设置 `USE_OLLAMA=true` 后检查 Ollama 模型和服务日志。
5. 检查端口、环境变量和请求超时。
6. 查看执行轨迹，确认失败发生在检索、模型调用还是回退阶段。

## Docker 说明

仓库现在提供了 `Dockerfile` 和 `docker-compose.yml`。有 Docker 的环境可以按下面的顺序启动：

```powershell
docker compose up -d --build
docker compose exec ollama ollama pull qwen2.5:1.5b
```

然后访问 `http://127.0.0.1:3000`。如果使用 Dify，可以在启动前设置 `DIFY_BASE_URL` 和 `DIFY_API_KEY`；当前服务优先使用 Dify，未配置 Dify 时使用 Compose 内的 Ollama。

2026 年 11 月 3 日已完成以下 Docker 验证：Docker Desktop 4.97.0、Docker 29.9.2、Compose v5.6.1、Linux Engine running；`docker compose config` 和 `docker compose build app` 成功。主 Compose 的 `ollama/ollama:latest` 镜像在当前网络下拉取较慢，尚未完成两个服务的完整启动。

已经用 `ops/docker-compose.host-ollama.yml` 验证 app 容器到本机 Ollama 的联调。Windows Docker Desktop 下需要显式加入：

```yaml
extra_hosts:
  - "host.docker.internal:host-gateway"
```

然后把 `OLLAMA_BASE_URL` 指向 `http://host.docker.internal:11435` 或本机可访问的 Ollama 监听地址。该路径已验证容器健康检查和真实模型问答；它是本机训练和排错备用路径，不替代主 Compose 的 Ollama 容器。

## 评测

运行离线、确定性的 20 条评测集：

```powershell
npm run evaluate
```

结果写入 `docs/evaluation-report.json`，包括通过率、每道题的输出、失败原因和处理轨迹。它用于验证知识库检索、结构化抽取、工具调用、人工复核和故障回退；真实 Ollama 或 Dify 的回答质量还需要单独做模型评测。

## 文档导入边界

当前 Node 和 FastAPI 适配层都支持 `.md`、`.markdown` 和 `.txt`。PDF 接口会返回 400，并提示先提取文字。这样可以避免把 PDF 二进制内容误存入知识库。后续接入 PDF 解析库时，应保留页码、标题和来源信息，再进入切分与检索流程。

## 已验证的接口对照

Node 和 FastAPI 已分别启动并对照以下接口：

```text
GET  /api/health
GET  /api/documents
GET  /api/documents/import
POST /api/ask
POST /api/workflow/extract
POST /api/engineering/review
POST /api/tools/calculate
POST /api/documents/import
```

两个适配层在成功状态码、主要字段、问答执行轨迹、证据字段和 PDF/空请求错误状态上已完成对照。回答文本可以不同，因为 Node 可调用 Ollama，而 FastAPI 当前是确定性的适配层演示回答器。
