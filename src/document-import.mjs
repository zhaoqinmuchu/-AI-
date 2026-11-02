const MAX_TITLE_LENGTH = 200;
const MAX_TYPE_LENGTH = 80;
const MAX_CONTENT_LENGTH = 200_000;
const supportedTextExtensions = new Set(['.md', '.markdown', '.txt']);

export class DocumentValidationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'DocumentValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

function extensionOf(fileName = '') {
  const match = String(fileName).toLowerCase().match(/\.[a-z0-9]+$/);
  return match?.[0] ?? '';
}

export function supportedDocumentTypes() {
  return {
    text: [...supportedTextExtensions],
    pdf: '需要先提取文字后导入；当前无第三方 PDF 解析依赖'
  };
}

export function normalizeDocumentInput(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new DocumentValidationError('请求体必须是 JSON 对象');
  }

  const title = String(input.title ?? '').trim();
  const type = String(input.type ?? '导入文档').trim();
  const content = String(input.content ?? '').trim();
  const fileName = String(input.fileName ?? '').trim();
  const updatedAt = String(input.updatedAt ?? new Date().toISOString().slice(0, 10)).trim();

  if (!title) throw new DocumentValidationError('title 不能为空', { field: 'title' });
  if (title.length > MAX_TITLE_LENGTH) throw new DocumentValidationError(`title 不能超过 ${MAX_TITLE_LENGTH} 个字符`, { field: 'title' });
  if (type.length > MAX_TYPE_LENGTH) throw new DocumentValidationError(`type 不能超过 ${MAX_TYPE_LENGTH} 个字符`, { field: 'type' });
  if (!content) throw new DocumentValidationError('content 不能为空', { field: 'content' });
  if (content.length > MAX_CONTENT_LENGTH) throw new DocumentValidationError(`content 不能超过 ${MAX_CONTENT_LENGTH} 个字符`, { field: 'content' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updatedAt)) throw new DocumentValidationError('updatedAt 必须使用 YYYY-MM-DD 格式', { field: 'updatedAt' });

  if (fileName) {
    const extension = extensionOf(fileName);
    if (extension === '.pdf') {
      throw new DocumentValidationError('当前接口不直接解析 PDF。请先提取 PDF 文字，再以 Markdown 或纯文本提交。', { field: 'fileName', supported: supportedDocumentTypes() });
    }
    if (extension && !supportedTextExtensions.has(extension)) {
      throw new DocumentValidationError(`不支持的文件类型：${extension}`, { field: 'fileName', supported: supportedDocumentTypes() });
    }
  }

  return { title, type, content, updatedAt, fileName };
}
