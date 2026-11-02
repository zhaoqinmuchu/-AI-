# 岗位调查执行清单

调查目标：杭州优先、南京备选；AI 应用实施和交付为主；相邻岗位作为保底；不把 CAD API 作为当前主线。

## 杭州主搜索词

- AI应用实施
- Agent实施
- 智能体实施
- AI交付
- AI解决方案
- AI全栈实施
- FDE
- 前线部署工程师
- Agent训练师
- 知识库实施
- RAG应用
- Dify
- Coze
- FastGPT
- SaaS实施
- RPA实施
- 系统实施工程师
- 技术支持工程师
- 客户成功
- Python AI应用
- API集成
- 智能化项目实施

## 南京主搜索词

- 软件实施
- 项目实施
- 智能化实施
- AI解决方案
- AI全栈实施
- FDE
- FAE技术服务
- 客户交付
- SaaS实施
- 系统集成
- 技术支持
- Python自动化
- API集成
- RPA实施
- 知识库实施

## 工程智能化补充词

- 工程智能体
- 工业AI
- CAD AI
- BIM AI
- 设计智能体
- 制造业智能体
- AI+工程
- 工程软件实施

## 调查来源优先级

1. 企业招聘页和高校就业平台原始详情；
2. 猎聘、BOSS 直聘、五八同城等岗位详情；
3. 企业产品页，用来识别潜在雇主和岗位类型；
4. 聚合页、岗位模型文章和行业文章，只作为线索，不计入有效岗位数量。

## 统一记录字段

`city,title,company,salary,experience,education,employment_type,duties,skills,python,api,rag,agent,dify,linux,docker,database,customer_contact,onsite_or_travel,source_url,source_date,verification_status,match_tier,match_score,gaps,risk_flags`

## 验证规则

- 搜索摘要只能标记为 `search_confirmed`；
- 读取详情页并看到职责和技能后标记为 `detail_verified`；
- 企业产品页标记为 `employer_lead`，不能当作岗位；
- 岗位模型文章标记为 `role_model`，不能当作岗位；
- 过期、薪资缺失、公司信息异常或明显培训收费的岗位标记风险；
- 不自动投递、不自动联系招聘者。
