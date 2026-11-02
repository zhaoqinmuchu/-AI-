# 方案运行验证报告

验证日期：2026 年 11 月 3 日

本报告记录当前工作区中已经实际运行过的内容。代码存在、配置存在和实时验证分开记录。

## 已通过

| 项目 | 验证结果 | 证据 |
|---|---|---|
| Node 运行时 | 通过 | Node v24.19.0，npm v11.17.0 |
| Node 单元测试 | 通过 | 9/9 |
| 离线评测 | 通过 | 20/20 |
| Python 虚拟环境 | 通过 | `.venv` 使用 Python 3.14.10 |
| FastAPI 依赖 | 通过 | FastAPI 0.162.0、Uvicorn 0.54.0、Pydantic 2.14.2 |
| Python 语法检查 | 通过 | `.venv\Scripts\python.exe -m compileall -q python_api` |
| FastAPI 接口烟测 | 通过 | 8010 端口逐接口请求成功 |
| Node/FastAPI 错误状态 | 通过 | 空请求和 PDF 导入均返回 400 |
| 本机 Ollama | 通过 | Ollama 0.40.13，`qwen2.5:1.5b` 已安装 |
| 本机 Ollama 推理 | 通过 | `/api/generate` 返回 `OK` |
| Docker Desktop | 通过 | 4.97.0，Linux Engine running |
| Docker CLI/Compose | 通过 | Docker 29.9.2，Compose v5.6.1 |
| 主 Compose 静态配置 | 通过 | `docker compose config` 成功 |
| 主 Compose app 构建 | 通过 | `docker compose build app` 成功 |
| 容器端口映射 | 通过 | 临时 Compose app 容器的 `/api/health` 返回 200 |
| 容器调用 Ollama | 通过 | 加入 `host-gateway` 后 `/api/ask` 返回真实模型回答 |
| 本机 Dify 服务可达 | 通过 | `/console/api/system-features` 返回 200，`/v1/chat-messages` 无 Key 返回预期 401 |

## 本轮修正

- Node 服务增加 `HOST` 环境变量；本地默认仍为 `127.0.0.1`，Docker 默认使用 `0.0.0.0`。
- Dockerfile 和主 Compose 显式设置 `HOST=0.0.0.0`，修复容器内服务启动但宿主机无法访问的问题。
- FastAPI 适配层补齐问答 `trace`、证据的 `documentId/type`、健康检查 `timestamp` 和导入响应字段。
- FastAPI 请求校验和业务错误统一为 400 响应，接近 Node 适配层的错误契约。
- FastAPI 流程抽取去掉 Node 版本没有的额外 `projectName` 字段。

## 尚未完全通过

### 主 Compose 的 Ollama 容器镜像

主 `docker-compose.yml` 的配置和 app 构建已经通过，但 `ollama/ollama:latest` 镜像拉取在当前网络环境下长时间停留在下载/导入阶段，验证过程中停止了该次拉取。没有因此声称主 Compose 的两个服务已经完整启动。

已经用备用 Compose 配置验证了等价的容器联调路径：app 容器通过 `host-gateway` 访问本机 Ollama，健康检查和真实模型问答均通过。配置文件为 `ops/docker-compose.host-ollama.yml`。

### Dify 实时联调

Dify 本机服务和 API 路由可达；`/v1/chat-messages` 在没有 Bearer API Key 时返回 401，说明剩余阻塞是应用 Key/应用配置，而不是服务地址完全不可用。当前没有使用中的 Dify API Key，因此没有声称 Dify 已完成实时模型联调。

### PDF 解析

Node 和 FastAPI 都已验证 PDF 直接导入返回 400。当前项目的行为是先提取 PDF 文字，再以 Markdown 或纯文本导入；没有把 PDF 解析能力写成已经完成。

## 清理结果

- 临时 app 容器和 Compose 网络已经删除。
- 临时 Ollama 11435 监听已经停止。
- 3010、8010、3003 和 11435 验证端口没有遗留本轮服务。
- Docker Desktop 中原有的 Dify 相关容器没有修改。

## 后续执行顺序

1. 训练窗口可以直接开始第 1 周课程，不再等待 Docker 主 Compose 镜像拉取。
2. 需要练习容器部署时，先使用已经验证过的 app + 本机 Ollama 路径。
3. 网络条件允许时，再运行 `docker compose up -d --build`，完成 Ollama 容器镜像拉取和模型下载。
4. 有 Dify API 地址和 Key 后，再单独做 Dify 联调，不改变固定课程主线。
