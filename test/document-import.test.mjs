import test from 'node:test';
import assert from 'node:assert/strict';
import { DocumentValidationError, normalizeDocumentInput, supportedDocumentTypes } from '../src/document-import.mjs';

test('normalizeDocumentInput accepts Markdown metadata and content', () => {
  const document = normalizeDocumentInput({
    title: '验收说明',
    type: '项目交付',
    fileName: 'acceptance.md',
    content: '# 验收说明',
    updatedAt: '2026-11-02'
  });
  assert.equal(document.title, '验收说明');
  assert.equal(document.fileName, 'acceptance.md');
});

test('normalizeDocumentInput rejects empty content and direct PDF input', () => {
  assert.throws(() => normalizeDocumentInput({ title: '空文档', content: '' }), (error) => {
    assert.ok(error instanceof DocumentValidationError);
    assert.equal(error.statusCode, 400);
    return true;
  });

  assert.throws(() => normalizeDocumentInput({ title: 'PDF', fileName: 'brief.pdf', content: 'binary placeholder' }), (error) => {
    assert.ok(error instanceof DocumentValidationError);
    assert.match(error.message, /不直接解析 PDF/);
    return true;
  });
});

test('supportedDocumentTypes makes the PDF boundary explicit', () => {
  const supported = supportedDocumentTypes();
  assert.deepEqual(supported.text, ['.md', '.markdown', '.txt']);
  assert.match(supported.pdf, /提取文字/);
});
