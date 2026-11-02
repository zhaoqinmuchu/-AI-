const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function setTrace(steps = []) {
  const trace = $('#trace-list');
  trace.innerHTML = steps.length ? steps.map((step, index) => `<span class="trace-step">${index + 1}. ${escapeHtml(step)}</span>`).join('') : '<span class="trace-placeholder">运行一次问答后查看每个步骤</span>';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

async function getJson(url, options) {
  const response = await fetch(url, options);
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || `请求失败：${response.status}`);
  return payload;
}

async function loadDocuments() {
  const payload = await getJson('/api/documents');
  $('#doc-count').textContent = payload.documents.length;
  $('#document-grid').innerHTML = payload.documents.map((document) => `<article class="document-card card"><div class="document-meta"><span>${escapeHtml(document.type)}</span><span>${escapeHtml(document.updatedAt)}</span></div><h3>${escapeHtml(document.title)}</h3><p>已纳入企业知识库，可被问答和工作流检索。</p></article>`).join('');
}

async function loadHealth() {
  const payload = await getJson('/api/health');
  const labels = { demo: '演示模式', ollama: 'Ollama 已配置', dify: 'Dify 已配置' };
  $('#provider-label').textContent = labels[payload.provider.mode] || payload.provider.mode;
  $('#provider-detail').textContent = payload.provider.mode === 'ollama' ? payload.provider.ollamaModel : '可切换真实模型服务';
}

async function askQuestion() {
  const button = $('#ask-button');
  const question = $('#question-input').value.trim();
  if (!question) return;
  button.disabled = true;
  button.querySelector('span').textContent = '正在运行…';
  try {
    const payload = await getJson('/api/ask', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question }) });
    $('#answer-body').textContent = payload.answer;
    $('#confidence').textContent = `置信度：${payload.confidence}`;
    $('#review-note').hidden = !payload.needsHumanReview;
    setTrace(payload.trace);
    if (payload.evidence.length) $('#answer-body').insertAdjacentHTML('beforeend', `\n\n依据文档：\n${payload.evidence.map((item) => `【${item.index}】${escapeHtml(item.title)} · ${escapeHtml(item.updatedAt)}`).join('\n')}`);
  } catch (error) {
    $('#answer-body').textContent = error.message;
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = '运行检索与回答';
  }
}

async function extractFields() {
  const button = $('#extract-button');
  button.disabled = true;
  try {
    const payload = await getJson('/api/workflow/extract', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: $('#workflow-input').value }) });
    $('#field-list').innerHTML = Object.entries(payload.fields).map(([key, value]) => `<div class="field-row"><strong>${escapeHtml(key)}</strong><span>${escapeHtml(value || '未识别')}</span></div>`).join('');
  } catch (error) {
    $('#field-list').textContent = error.message;
  } finally {
    button.disabled = false;
  }
}

async function reviewEngineering() {
  const button = $('#engineering-button');
  const text = $('#engineering-input').value.trim();
  if (!text) return;
  button.disabled = true;
  button.querySelector('span').textContent = '正在审查…';
  try {
    const payload = await getJson('/api/engineering/review', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text })
    });
    $('#engineering-status').textContent = payload.reviewStatus;
    $('#engineering-result').textContent = [
      `摘要：${payload.summary}`,
      `字段：${JSON.stringify(payload.fields, null, 2)}`,
      `风险：${payload.riskFlags.length ? payload.riskFlags.join('；') : '未发现风险标记'}`,
      `依据：${payload.evidence.length ? payload.evidence.map((item) => `【${item.index}】${item.title}`).join('、') : '暂无充分依据'}`,
      `轨迹：${payload.trace.join(' → ')}`
    ].join('\n\n');
  } catch (error) {
    $('#engineering-result').textContent = error.message;
  } finally {
    button.disabled = false;
    button.querySelector('span').textContent = '审查工程问题';
  }
}

async function calculateProgress() {
  const result = $('#progress-result');
  try {
    const payload = await getJson('/api/tools/calculate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'progress', completed: Number($('#progress-completed').value), total: Number($('#progress-total').value) })
    });
    result.textContent = `完成率 ${payload.percentage}% · ${payload.reviewStatus}`;
  } catch (error) {
    result.textContent = error.message;
  }
}

async function importDocument() {
  const title = $('#document-title').value.trim();
  const type = $('#document-type').value.trim();
  const content = $('#document-content').value.trim();
  if (!title || !content) return;
  const button = $('#import-button');
  button.disabled = true;
  try {
    await getJson('/api/documents/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title, type, content, fileName: $('#document-file').files[0]?.name ?? '' })
    });
    $('#document-title').value = '';
    $('#document-content').value = '';
    $('#document-file').value = '';
    await loadDocuments();
  } catch (error) {
    window.alert(error.message);
  } finally {
    button.disabled = false;
  }
}

$('#document-file').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (file.name.toLowerCase().endsWith('.pdf')) {
    window.alert('当前版本不直接解析 PDF。请先提取 PDF 文字，再粘贴到内容框中。');
    event.target.value = '';
    return;
  }
  $('#document-title').value = $('#document-title').value || file.name.replace(/\.(md|markdown|txt)$/i, '');
  $('#document-content').value = await file.text();
});

$$('.nav-item').forEach((button) => button.addEventListener('click', () => {
  $$('.nav-item').forEach((item) => item.classList.toggle('active', item === button));
  $$('.panel').forEach((panel) => panel.classList.toggle('active-panel', panel.id === `panel-${button.dataset.panel}`));
}));
$$('[data-question]').forEach((button) => button.addEventListener('click', () => { $('#question-input').value = button.dataset.question; askQuestion(); }));
$('#ask-button').addEventListener('click', askQuestion);
$('#extract-button').addEventListener('click', extractFields);
$('#engineering-button').addEventListener('click', reviewEngineering);
$('#progress-button').addEventListener('click', calculateProgress);
$('#import-button').addEventListener('click', importDocument);
$('#health-button').addEventListener('click', loadHealth);
$('#question-input').addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') askQuestion(); });
await Promise.all([loadDocuments(), loadHealth()]);
