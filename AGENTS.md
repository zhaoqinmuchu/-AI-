# 双窗口协作总规则

本工作区服务两个执行窗口和一个轻量总控角色。两个执行窗口相互影响但不能互相直接改计划：

- 招聘窗口：调查杭州和南京的真实岗位，形成岗位事实和技能证据；
- 训练窗口：根据已冻结的岗位证据安排课程、案例、练习和验收。
- 总控窗口：按周审核市场快照、训练进度和课程调整提案，冻结下一周课程。

## 启动方式

新窗口进入项目 worktree 后，先读取 `docs/交接-2026-11-03.md`，再根据用户声明的窗口角色读取对应规则文件。交接文档记录当前岗位目标、用户已确认条件、项目验证边界和下一步任务。

用户打开本工作区后会明确当前角色：

```text
当前窗口：招聘窗口
```

或：

```text
当前窗口：训练窗口
```

或：

```text
当前窗口：总控窗口
```

收到角色后，先读取对应规则：

- 招聘窗口：`agents/recruitment/AGENTS.md`；
- 训练窗口：`agents/training/AGENTS.md`。
- 总控窗口：`agents/coordinator/AGENTS.md`。

如果用户没有说明角色，不要猜测；先询问当前是招聘窗口、训练窗口还是总控窗口。

## 所有窗口都必须读取的内容

1. `docs/双窗口同步机制.md`
2. `docs/动态技能进入规则.md`
3. `outputs/sync/course-freeze.md`
4. 最新的 `outputs/sync/weekly-decisions/` 文件
5. 当前日期对应的市场快照或训练进度文件

## 角色隔离原则

招聘窗口负责事实，训练窗口负责学习。

- 招聘窗口不能直接修改固定课程、训练进度和课程冻结记录；
- 训练窗口不能修改岗位薪资、学历、经验、核实状态和原始招聘事实；
- 总控窗口只能根据已记录证据修改周度决定、课程冻结和未来课程提案，不回写岗位原始事实；
- 市场变化只能通过市场快照、技能证据和课程调整提案影响课程；
- 课程变化只有在周度决定确认后才能生效；
- 当前冻结周的固定课程不能因为单个岗位临时改变。

## 共同禁止事项

- 不自动投递；
- 不自动联系招聘者；
- 不绕过验证码、安全校验或登录限制；
- 不把搜索摘要直接当成详情已核实岗位；
- 不把实习、校招、企业宣传页和岗位模型文章冒充为适合用户的正式社招岗位；
- 不把用户包装成 CAD API、工业软件二次开发或高级后端工程师；
- 不把 Codex 生成的代码直接视为用户已经掌握的能力；
- 不在没有验证时声称 Python、FastAPI、Docker 或 Ollama 已经实际运行。

## 当前项目事实

- Node 服务和项目测试是当前主要可运行基线；
- 当前 Node 测试为 9/9，离线评测为 20/20；
- Python 真实运行时已安装，Python 3.13/3.14 可直接调用；系统 `python` 命令仍指向 Windows 商店占位入口，工作区 `.venv` 已可用；
- Docker Desktop 4.97.0 已安装，Linux Engine、Docker CLI 29.9.2 和 Compose v5.6.1 已验证；主 Compose 的 Ollama 镜像完整拉取仍受当前网络影响；
- FastAPI 适配层存在，但必须区分代码准备和实际运行验证；
- 当前岗位追踪表是基线数据库，不等于已经达到杭州 50 条、南京 25 条的调查目标。

## 当前验证事实

- Node 测试：9/9；离线评测：20/20；
- `.venv` 使用 Python 3.14.10，FastAPI 适配层已在 8010 端口完成启动和接口烟测；
- 本机 Ollama 0.40.13 已安装 `qwen2.5:1.5b`，本机生成请求已通过；
- Docker app 容器已完成构建、端口映射和通过 `host-gateway` 调用本机 Ollama 的真实问答；
- 主 Compose 的 `docker compose config` 和 `docker compose build app` 已通过，`ollama/ollama:latest` 容器镜像拉取尚未完整完成；
- Dify 本机服务和 `/v1/chat-messages` 路由已验证可达；无 API Key 时返回 401，未配置 Key，因此不声称实时模型联调完成；
- 详细证据见 `outputs/sync/verification-report-2026-11-03.md`。

## 输出要求

每次工作结束时，必须说明：

```text
当前窗口：招聘窗口 / 训练窗口
本轮完成：
读取的依据：
写入的文件：
未完成事项：
是否需要同步裁决：是 / 否
下一步：
```

## 角色规则文件

- 招聘窗口：[agents/recruitment/AGENTS.md](agents/recruitment/AGENTS.md)
- 训练窗口：[agents/training/AGENTS.md](agents/training/AGENTS.md)
- 总控窗口：[agents/coordinator/AGENTS.md](agents/coordinator/AGENTS.md)
