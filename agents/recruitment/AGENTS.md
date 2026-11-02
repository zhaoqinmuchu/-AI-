# 招聘市场窗口规则

当前角色：招聘窗口。

## 任务目标

围绕杭州优先、南京备选的 AI 应用实施、Agent 交付、FDE 初级、AI 解决方案、Python + AI 应用开发、SaaS/RPA 实施岗位，持续获取真实、可核实、可用于课程决策的岗位证据。

## 启动时读取顺序

按以下顺序读取：

1. 根目录 `AGENTS.md`；
2. `docs/双窗口同步机制.md`；
3. `docs/动态技能进入规则.md`；
4. `outputs/sync/course-freeze.md`；
5. 最新 `outputs/sync/market-snapshots/` 文件；
6. `outputs/job-survey-tracker.csv`；
7. `outputs/hangzhou-nanjing-ai-jobs-initial.md`；
8. `outputs/job-survey-queries.md`；
9. `outputs/job-matching-cards.md`。

如果用户只说“继续调查”，先检查最近一份市场快照和岗位追踪表，再从未覆盖的城市、岗位类型或关键词继续，不重复读取已经核实的岗位。

## 可以写入

- `outputs/job-survey-tracker.csv`；
- `outputs/hangzhou-nanjing-ai-jobs-initial.md`；
- `outputs/job-survey-queries.md`；
- `outputs/sync/market-snapshots/`；
- `outputs/sync/skill-evidence.csv`；
- 招聘窗口专用的调查记录和岗位匹配草稿。

## 不得直接写入

- `docs/教材-ai应用实施与交付.md` 的固定课程主线；
- `docs/教材练习与验收清单.md`；
- `docs/学习进度记录.md`；
- `outputs/sync/course-freeze.md`；
- `outputs/sync/weekly-decisions/`；
- 用户的学习掌握状态。

如果市场结果显示某项技能值得学习，只能写入技能证据和市场快照，并在报告中提出建议。不得直接改课。

## 岗位记录要求

每条岗位尽量记录：

- 公司；
- 职位；
- 城市和区域；
- 薪资；
- 学历；
- 经验；
- 用工形式；
- 职责；
- 技能；
- 客户沟通、出差、驻场、培训要求；
- 原始链接；
- 页面日期；
- 核实状态；
- A/B/C 匹配等级；
- 用户已有证据；
- 技能缺口；
- 风险提示。

## 核实状态

只使用以下状态：

- `detail_verified`：打开详情并读取了职责或任职要求；
- `search_confirmed`：搜索结果确认存在，但详情未完整读取；
- `company_lead`：公司招聘页或业务线索，不等于单个岗位；
- `reference_only`：跨城市或技能模型参考；
- `expired_reference`：过期岗位，仅供技能参考；
- `role_model`：岗位模型文章，不是招聘详情。

只有 `detail_verified` 才能作为强技能证据。`search_confirmed`、`company_lead`、`reference_only` 和 `role_model` 不能单独推动课程变化。

## 动态技能证据规则

调查时不要只统计关键词出现次数，还要记录：

- 技能是硬要求还是加分项；
- 是否出现在职责中；
- 是否来自详情已核实岗位；
- 是否与用户 A/B 岗位相关；
- 是否来自不同公司；
- 是否属于全职而不是实习/校招。

按照 `docs/动态技能进入规则.md` 分类为观察、候选、已批准、固定核心、长期路线或暂缓。

## 每周输出

每周调查结束后生成市场快照，必须包含：

1. 新增岗位数量；
2. 详情已核实数量；
3. 杭州和南京分别的有效样本；
4. 高频职责；
5. 高频技能；
6. A/B/C 岗位分布；
7. 新增动态技能候选；
8. 本周不应改变课程的技能；
9. 数据缺口；
10. 下一周调查关键词。

## 调查结束判断

完成一个调查轮次的标准：

- 没有重复录入已经存在的岗位；
- 每个新增岗位有来源和核实状态；
- 明确区分真实岗位、线索、参考和过期信息；
- 形成技能证据，而不是只有岗位标题；
- 生成市场快照；
- 没有直接修改训练计划。

## 启动提示示例

用户可以只发送：

```text
当前窗口：招聘窗口。继续调查杭州和南京 AI 应用实施、Agent 交付和 Python/AI 应用岗位。
```

收到后，直接读取本规则和最新同步文件，继续未完成的调查。
