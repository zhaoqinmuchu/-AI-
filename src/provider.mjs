import { buildEvidence, buildMockAnswer, searchDocuments } from './knowledge.mjs';

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL ?? 'http://127.0.0.1:11434';
const ollamaModel = process.env.OLLAMA_MODEL ?? 'qwen2.5:1.5b';
const difyBaseUrl = process.env.DIFY_BASE_URL;
const difyApiKey = process.env.DIFY_API_KEY;

async function askOllama(question, evidence) {
  const response = await fetch(`${ollamaBaseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: ollamaModel,
      stream: false,
      messages: [
        { role: 'system', content: '你是企业知识库助手。只根据提供的资料回答，不确定时明确说明。' },
        { role: 'user', content: `资料：\n${evidence.map((item) => `【${item.index}】${item.title}：${item.excerpt}`).join('\n')}\n\n问题：${question}` }
      ]
    }),
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) throw new Error(`Ollama 返回 ${response.status}`);
  const payload = await response.json();
  return payload.message?.content?.trim() || '模型没有返回有效内容。';
}

async function askDify(question, user = 'portfolio-demo') {
  const response = await fetch(`${difyBaseUrl.replace(/\/$/, '')}/chat-messages`, {
    method: 'POST',
    headers: { authorization: `Bearer ${difyApiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({ inputs: {}, query: question, response_mode: 'blocking', user }),
    signal: AbortSignal.timeout(30000)
  });

  if (!response.ok) throw new Error(`Dify 返回 ${response.status}`);
  const payload = await response.json();
  return payload.answer?.trim() || 'Dify 没有返回有效内容。';
}

export function providerStatus() {
  return {
    mode: difyBaseUrl && difyApiKey ? 'dify' : process.env.USE_OLLAMA === 'true' ? 'ollama' : 'demo',
    ollamaModel,
    difyConfigured: Boolean(difyBaseUrl && difyApiKey)
  };
}

export async function answerQuestion(question) {
  const results = searchDocuments(question);
  const evidence = buildEvidence(results);
  const status = providerStatus();
  const trace = ['接收问题', `检索知识库：命中 ${results.length} 条`, status.mode === 'demo' ? '使用演示回答器' : `调用 ${status.mode} 模型服务`, '整理引用和人工复核提示'];

  try {
    if (status.mode === 'dify') {
      return { answer: await askDify(question), confidence: results.length > 0 ? 'medium' : 'low', needsHumanReview: results.length === 0, evidence, trace };
    }
    if (status.mode === 'ollama') {
      return { answer: await askOllama(question, evidence), confidence: results.length > 0 ? 'medium' : 'low', needsHumanReview: results.length === 0, evidence, trace };
    }
    const mock = buildMockAnswer(question, results);
    return { ...mock, evidence, trace };
  } catch (error) {
    const mock = buildMockAnswer(question, results);
    return { ...mock, fallbackReason: error.message, trace: [...trace, `模型服务失败，已回退到演示回答：${error.message}`], evidence };
  }
}
