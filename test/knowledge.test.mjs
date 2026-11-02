import test from 'node:test';
import assert from 'node:assert/strict';
import { buildMockAnswer, extractWorkflowFields, searchDocuments } from '../src/knowledge.mjs';
import { reviewEngineeringDocument } from '../src/engineering.mjs';
import { calculateTool } from '../src/toolbox.mjs';

test('searchDocuments finds the expense policy for a travel question', () => {
  const results = searchDocuments('杭州出差住宿超过标准怎么办？');
  assert.equal(results[0].id, 'expense-policy');
  assert.ok(results[0].score > 0);
});

test('buildMockAnswer requests human review when evidence is absent', () => {
  const result = buildMockAnswer('公司食堂今天有什么菜？', []);
  assert.equal(result.needsHumanReview, true);
  assert.equal(result.confidence, 'low');
});

test('extractWorkflowFields returns structured fields and review status', () => {
  const result = extractWorkflowFields('出差地：杭州\n事由：客户项目上线支持\n费用：680 元');
  assert.equal(result.city, '杭州');
  assert.equal(result.amount, '680元');
  assert.equal(result.reviewStatus, '需要人工复核');
});

test('reviewEngineeringDocument returns evidence and human review for a safety issue', () => {
  const result = reviewEngineeringDocument('项目名称：滨江办公楼改造项目。问题：临边防护存在隐患。');
  assert.equal(result.reviewStatus, 'human_review');
  assert.ok(result.evidence.length > 0);
  assert.ok(result.riskFlags.some((flag) => flag.includes('现场安全')));
});

test('reviewEngineeringDocument refuses unsupported engineering conclusions', () => {
  const result = reviewEngineeringDocument('请判断这份 CAD 图纸的颜色是否符合行业标准。');
  assert.equal(result.reviewStatus, 'insufficient_evidence');
  assert.equal(result.evidence.length, 0);
});

test('calculateTool handles expense review and progress calculation', () => {
  const expense = calculateTool({ type: 'expense', amount: 680, limit: 450 });
  assert.equal(expense.reviewStatus, 'human_review');
  assert.equal(expense.difference, 230);

  const progress = calculateTool({ type: 'progress', completed: 6, total: 10 });
  assert.equal(progress.percentage, 60);
  assert.equal(progress.reviewStatus, 'pass');
});
