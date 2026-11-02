# 企业 AI 工作台接口示例

默认服务地址：`http://127.0.0.1:3000`

## 1. 健康检查

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/health | ConvertTo-Json -Depth 5
```

预期结果包含：

```json
{
  "ok": true,
  "provider": {
    "mode": "demo"
  }
}
```

## 2. 查看知识库

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/documents | ConvertTo-Json -Depth 5
```

接口只返回文档元数据，不直接返回完整正文，避免列表接口暴露全部知识库内容。

## 3. 提问

```powershell
$body = @{ question = '杭州出差住宿超过标准怎么办？' } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:3000/api/ask -Method Post -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 8
```

重点观察：

- `answer`：回答内容；
- `confidence`：当前结果的置信度；
- `needsHumanReview`：是否需要人工复核；
- `evidence`：引用依据；
- `trace`：执行轨迹。

## 4. 导入 Markdown 或纯文本

```powershell
$body = @{
  title = '客户验收补充说明'
  type = '项目交付'
  fileName = 'acceptance.md'
  content = '# 验收说明`n客户验收需要演示核心流程并提交部署说明。'
} | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:3000/api/documents/import -Method Post -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 5
```

当前支持 `.md`、`.markdown` 和 `.txt`。PDF 接口会明确返回 400，提示先提取 PDF 文字，再按纯文本提交。这样做是为了避免在没有 PDF 解析库时误把二进制内容写入知识库。

查看导入能力：

```powershell
Invoke-RestMethod http://127.0.0.1:3000/api/documents/import | ConvertTo-Json -Depth 5
```

## 5. 流程字段抽取

```powershell
$body = @{ text = '出差地：杭州`n事由：客户项目上线支持`n费用：680 元' } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:3000/api/workflow/extract -Method Post -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 5
```

## 6. 工程审查

```powershell
$body = @{ text = '项目名称：滨江办公楼改造项目。问题：临边防护存在隐患。' } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:3000/api/engineering/review -Method Post -ContentType 'application/json' -Body $body | ConvertTo-Json -Depth 8
```

安全问题应该返回 `human_review`，并包含现场确认相关风险标记。

## 7. 工具调用

费用：

```powershell
$body = @{ type = 'expense'; amount = 680; limit = 450 } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:3000/api/tools/calculate -Method Post -ContentType 'application/json' -Body $body | ConvertTo-Json
```

进度：

```powershell
$body = @{ type = 'progress'; completed = 6; total = 10 } | ConvertTo-Json
Invoke-RestMethod http://127.0.0.1:3000/api/tools/calculate -Method Post -ContentType 'application/json' -Body $body | ConvertTo-Json
```

## 8. 常见错误

| 情况 | 状态码 | 处理方式 |
|---|---:|---|
| 请求体不是 JSON | 400 | 检查 `ConvertTo-Json` 和 `Content-Type` |
| `question` 或 `text` 为空 | 400 | 补充必填字段 |
| 文档标题为空 | 400 | 增加 `title` |
| 文档超过 200000 字符 | 400 | 拆分文档后导入 |
| PDF 直接上传 | 400 | 先提取文字再提交 |
| 请求体超过 1 MB | 413 | 减小请求体或拆分请求 |
| 模型服务失败 | 200 | 查看 `fallbackReason` 和 `trace` |
