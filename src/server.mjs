import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { answerQuestion, providerStatus } from './provider.mjs';
import { addDocument, documents, extractWorkflowFields } from './knowledge.mjs';
import { reviewEngineeringDocument } from './engineering.mjs';
import { calculateTool } from './toolbox.mjs';
import { DocumentValidationError, supportedDocumentTypes } from './document-import.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const publicDir = join(root, 'public');
const port = Number(process.env.PORT ?? 3000);
const host = process.env.HOST ?? '127.0.0.1';
const mimeTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml' };

function json(response, statusCode, payload) {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const contentLength = Number(request.headers['content-length'] ?? 0);
  if (contentLength > 1_000_000) {
    const error = new Error('请求体不能超过 1 MB');
    error.statusCode = 413;
    throw error;
  }
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('请求体必须是合法 JSON');
    error.statusCode = 400;
    throw error;
  }
}

async function serveStatic(request, response) {
  const requested = request.url === '/' ? '/index.html' : request.url.split('?')[0];
  const filePath = normalize(join(publicDir, requested));
  if (!filePath.startsWith(publicDir)) return json(response, 403, { error: 'Forbidden' });
  try {
    const body = await readFile(filePath);
    response.writeHead(200, { 'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream' });
    response.end(body);
  } catch {
    json(response, 404, { error: 'Not found' });
  }
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`);
    if (request.method === 'GET' && url.pathname === '/api/health') return json(response, 200, { ok: true, provider: providerStatus(), timestamp: new Date().toISOString() });
    if (request.method === 'GET' && url.pathname === '/api/documents') return json(response, 200, { documents: documents.map(({ content, ...document }) => document) });
    if (request.method === 'GET' && url.pathname === '/api/documents/import') return json(response, 200, { supported: supportedDocumentTypes() });
    if (request.method === 'POST' && url.pathname === '/api/documents/import') {
      const body = await readBody(request);
      return json(response, 201, { document: addDocument(body) });
    }
    if (request.method === 'POST' && url.pathname === '/api/ask') {
      const body = await readBody(request);
      const question = String(body.question ?? '').trim();
      if (!question) return json(response, 400, { error: 'question 不能为空' });
      return json(response, 200, await answerQuestion(question));
    }
    if (request.method === 'POST' && url.pathname === '/api/workflow/extract') {
      const body = await readBody(request);
      const text = String(body.text ?? '').trim();
      if (!text) return json(response, 400, { error: 'text 不能为空' });
      return json(response, 200, { fields: extractWorkflowFields(text) });
    }
    if (request.method === 'POST' && url.pathname === '/api/engineering/review') {
      const body = await readBody(request);
      const text = String(body.text ?? '').trim();
      if (!text) return json(response, 400, { error: 'text 不能为空' });
      return json(response, 200, reviewEngineeringDocument(text));
    }
    if (request.method === 'POST' && url.pathname === '/api/tools/calculate') {
      const body = await readBody(request);
      return json(response, 200, calculateTool(body));
    }
    return serveStatic(request, response);
  } catch (error) {
    const statusCode = error instanceof DocumentValidationError ? error.statusCode : Number(error.statusCode) || 500;
    return json(response, statusCode, { error: error.message, details: error.details ?? undefined });
  }
});

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  server.listen(port, host, () => console.log(`Enterprise AI Workbench running at http://${host}:${port}`));
}

export { server };
