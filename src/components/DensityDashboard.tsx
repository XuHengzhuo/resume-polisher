'use client';

import { useStore } from '@/store/useStore';
import { getDensityLevel } from '@/lib/density';
import { BarChart3, AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

export function DensityDashboard() {
  const density = useStore(s => s.density);
  const level = getDensityLevel(density.density);

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>字符: <strong>{density.charCount}</strong></span>
          <span>行数: <strong>{density.lineCount}</strong></span>
          <span>数字: <strong>{density.numberCount}</strong></span>
        </div>

        <div
          className="flex items-center gap-1.5 text-xs font-medium"
          style={{ color: level.color }}
        >
          {level.level === 'danger' && <AlertTriangle size={14} />}
          {level.level === 'warning' && <AlertCircle size={14} />}
          {level.level === 'good' && <CheckCircle size={14} />}
          <span>数据密度: {density.density} /100字</span>
          <span className="text-gray-400">({level.label})</span>
        </div>
      </div>

      {/* 密度进度条 */}
      <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(100, density.density * 20)}%`,
            backgroundColor: level.color,
          }}
        />
      </div>

      {level.level === 'danger' && (
        <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
          <AlertTriangle size={10} />
          数据密度偏低！运营简历建议每100字至少含2个数字
        </p>
      )}
    </div>
  );
}
