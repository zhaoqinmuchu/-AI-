export function calculateTool(input = {}) {
  const type = String(input.type || 'expense');
  if (type === 'expense') {
    const amount = Number(input.amount);
    const limit = Number(input.limit ?? 450);
    if (!Number.isFinite(amount) || !Number.isFinite(limit)) throw new Error('amount 和 limit 必须是数字');
    return {
      type,
      amount,
      limit,
      difference: amount - limit,
      overBudget: amount > limit,
      reviewStatus: amount > limit ? 'human_review' : 'pass'
    };
  }

  if (type === 'progress') {
    const completed = Number(input.completed);
    const total = Number(input.total);
    if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) throw new Error('completed 和 total 必须是有效数字');
    return {
      type,
      completed,
      total,
      percentage: Math.round((completed / total) * 10000) / 100,
      reviewStatus: completed > total ? 'human_review' : 'pass'
    };
  }

  throw new Error(`不支持的工具类型：${type}`);
}
