import { buildEvidence, searchDocuments } from './knowledge.mjs';

function firstMatch(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

export function reviewEngineeringDocument(input) {
  const text = String(input ?? '').trim();
  const results = searchDocuments(text || '工程项目安全验收');
  const evidence = buildEvidence(results.filter((item) => item.id.startsWith('engineering-')));
  const riskFlags = [];
  const trace = ['接收工程问题', `检索工程文档：命中 ${evidence.length} 条`];

  if (/安全|隐患|临边|脚手架|临时用电/.test(text)) riskFlags.push('涉及现场安全，必须由专业人员现场确认');
  if (/付款|金额|合同|验收/.test(text)) riskFlags.push('涉及合同或付款结论，需要核对签字和审批记录');
  if (/变更|工期|延期|范围/.test(text)) riskFlags.push('涉及变更、工期或范围，需要走正式审批流程');

  const fields = {
    projectName: firstMatch(text, [/项目名称[：:]\s*([^\n。]+)/]),
    owner: firstMatch(text, [/负责人[：:]\s*([^\n。]+)/]),
    dueDate: firstMatch(text, [/(?:截止日期|竣工日期|完成日期)[：:]\s*([0-9]{4}[-年][0-9]{1,2}[-月][0-9]{1,2}日?)/]),
    issue: firstMatch(text, [/(?:问题|隐患|事项)[：:]\s*([^\n。]+)/])
  };

  let reviewStatus = 'pass';
  if (evidence.length === 0) reviewStatus = 'insufficient_evidence';
  if (riskFlags.length > 0) reviewStatus = 'human_review';
  trace.push(riskFlags.length ? `识别风险：${riskFlags.length} 项` : '未发现需要升级的风险标记');
  trace.push(reviewStatus === 'pass' ? '输出可执行摘要' : '提示人工复核和现场确认');

  const summary = evidence.length
    ? `已根据 ${evidence.length} 份工程文档生成初步判断。${riskFlags.length ? '当前结果包含需要人工复核的风险项。' : '当前问题可以进入常规资料核验。'}`
    : '当前工程知识库没有足够依据，建议补充项目规范、合同条款或现场记录后再判断。';

  return { summary, fields, evidence, riskFlags, reviewStatus, trace };
}
