import { DensityStats } from '@/types';

/** 计算运营数据密度 */
export function calcDensity(text: string): DensityStats {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const charCount = text.replace(/\s/g, '').length;
  const numberMatches = text.match(/\d+(\.\d+)?/g);
  const numberCount = numberMatches ? numberMatches.length : 0;
  const density = charCount > 0 ? (numberCount / charCount) * 100 : 0;

  return {
    charCount,
    lineCount: lines.length,
    numberCount,
    density: Math.round(density * 10) / 10,
  };
}

/** 获取密度等级 */
export function getDensityLevel(density: number): {
  level: 'danger' | 'warning' | 'good';
  color: string;
  label: string;
} {
  if (density < 1.5) {
    return { level: 'danger', color: '#ef4444', label: '偏低' };
  }
  if (density < 3) {
    return { level: 'warning', color: '#f59e0b', label: '一般' };
  }
  return { level: 'good', color: '#22c55e', label: '优秀' };
}
