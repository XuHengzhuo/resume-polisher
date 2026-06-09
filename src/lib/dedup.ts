/**
 * 防重复替换工具
 * 解决多次点击"一键润色"导致"实现显著推动…实现显著提升"这种递归嵌套问题
 */

/** 常见递归嵌套模式检测 */
const RECURSIVE_PATTERNS = [
  /实现显著.{0,10}实现显著/g,
  /推动.{0,10}推动/g,
  /主导.{0,10}主导/g,
  /显著.{0,10}显著/g,
  /优化.{0,10}优化/g,
  /执行.{0,10}执行/g,
  /增长.{0,10}增长/g,
];

/**
 * 检测文本中是否存在递归嵌套的重复短语
 */
export function hasRecursiveDuplication(text: string): boolean {
  return RECURSIVE_PATTERNS.some(pattern => pattern.test(text));
}

/**
 * 清理递归嵌套的重复短语
 * 例如："推动…实现显著推动…实现显著提升" → "推动…实现显著提升"
 */
export function cleanRecursiveDuplication(text: string): string {
  let result = text;
  // 检测并移除 "X…Y" 嵌套在 "X…Y" 中的情况
  // 例如: "推动…实现显著推动了活跃度" → "推动了活跃度"
  result = result.replace(/推动…实现显著推动/g, '推动');
  result = result.replace(/实现显著.{0,10}实现显著/g, '实现显著');
  result = result.replace(/主导.{0,10}主导/g, '主导');
  result = result.replace(/建立机制优化.{0,10}建立机制优化/g, '建立机制优化');
  result = result.replace(/执行.{0,10}执行/g, '执行');

  return result;
}

/**
 * 安全应用单条替换，避免重复嵌套
 * - 如果替换后的文本已在原文本中 → 跳过
 * - 如果替换会产生递归嵌套 → 跳过
 */
export function safeReplace(
  text: string,
  original: string,
  replacement: string
): { text: string; applied: boolean } {
  // 如果原文本已不包含 original → 跳过
  if (!text.includes(original)) {
    return { text, applied: false };
  }

  // 如果 replacement 已经存在 → 跳过（无需重复替换）
  if (text.includes(replacement)) {
    return { text, applied: false };
  }

  // 如果 replacement 中包含 original（自引用） → 只替换第一次出现
  if (replacement.includes(original)) {
    // 找到第一次出现的位置，只替换那一个
    const idx = text.indexOf(original);
    const newText = text.slice(0, idx) + replacement + text.slice(idx + original.length);
    return { text: newText, applied: true };
  }

  // 正常替换
  const newText = text.replace(original, replacement);
  return { text: newText, applied: newText !== text };
}

/**
 * 批量安全替换，按顺序应用，每次替换后检查不会产生递归嵌套
 */
export function batchSafeReplace(
  text: string,
  replacements: { original: string; replacement: string }[]
): { text: string; appliedCount: number } {
  let result = text;
  let appliedCount = 0;

  for (const { original, replacement } of replacements) {
    const { text: newText, applied } = safeReplace(result, original, replacement);
    if (applied) {
      result = newText;
      appliedCount++;
    }
  }

  // 最终清理
  if (hasRecursiveDuplication(result)) {
    result = cleanRecursiveDuplication(result);
  }

  return { text: result, appliedCount };
}

/**
 * 检查文本是否已经过润色（用于避免重复润色）
 */
export function isAlreadyPolished(text: string, changes: { original: string }[]): boolean {
  // 如果所有 original 短语都不再存在于文本中，说明已经润色过了
  const remainingOriginals = changes.filter(c => text.includes(c.original));
  return remainingOriginals.length === 0;
}
