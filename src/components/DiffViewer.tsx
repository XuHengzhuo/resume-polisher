'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight, Eye, EyeOff } from 'lucide-react';
import { useStore } from '@/store/useStore';

interface DiffLine {
  type: 'same' | 'added' | 'removed';
  text: string;
  lineNum: number;
}

/** 简单的行级 diff 算法 */
function simpleDiff(original: string, modified: string): DiffLine[] {
  const origLines = original.split('\n');
  const modLines = modified.split('\n');
  const result: DiffLine[] = [];

  const maxLen = Math.max(origLines.length, modLines.length);

  for (let i = 0; i < maxLen; i++) {
    const orig = origLines[i];
    const mod = modLines[i];

    if (orig === undefined && mod !== undefined) {
      result.push({ type: 'added', text: mod, lineNum: i + 1 });
    } else if (mod === undefined && orig !== undefined) {
      result.push({ type: 'removed', text: orig, lineNum: i + 1 });
    } else if (orig === mod) {
      result.push({ type: 'same', text: orig, lineNum: i + 1 });
    } else {
      // 字符级差异尝试
      if (orig && mod) {
        result.push({ type: 'removed', text: orig, lineNum: i + 1 });
        result.push({ type: 'added', text: mod, lineNum: i + 1 });
      }
    }
  }

  return result;
}

export function DiffViewer() {
  const resumeText = useStore(s => s.resumeText);
  const polishedText = useStore(s => s.polishedText);
  const setResumeText = useStore(s => s.setResumeText);
  const addSnapshot = useStore(s => s.addSnapshot);
  const snapshots = useStore(s => s.snapshots);

  const [compareWith, setCompareWith] = useState<'polished' | 'snapshot'>('polished');
  const [selectedSnapshot, setSelectedSnapshot] = useState<string>('');
  const [showUnchanged, setShowUnchanged] = useState(true);

  const compareText = useMemo(() => {
    if (compareWith === 'polished' && polishedText) return polishedText;
    if (compareWith === 'snapshot' && selectedSnapshot) {
      const snap = snapshots.find(s => s.id === selectedSnapshot);
      return snap?.text || '';
    }
    return '';
  }, [compareWith, polishedText, selectedSnapshot, snapshots]);

  const diffLines = useMemo(() => {
    if (!compareText) return [];
    return simpleDiff(resumeText, compareText);
  }, [resumeText, compareText]);

  const filteredLines = useMemo(() => {
    if (showUnchanged) return diffLines;
    return diffLines.filter(l => l.type !== 'same');
  }, [diffLines, showUnchanged]);

  const handleApplyAll = () => {
    if (compareText) {
      addSnapshot('应用diff前自动保存');
      setResumeText(compareText);
    }
  };

  if (!polishedText && snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <ArrowLeftRight size={32} />
        <p className="text-sm">尚无对比内容</p>
        <p className="text-xs">先使用润色功能或保存历史快照</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 对比选项 */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setCompareWith('polished')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              compareWith === 'polished' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            润色结果
          </button>
          <button
            onClick={() => setCompareWith('snapshot')}
            className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
              compareWith === 'snapshot' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:text-gray-700'
            }`}
            disabled={snapshots.length === 0}
          >
            历史快照
          </button>
        </div>

        {compareWith === 'snapshot' && snapshots.length > 0 && (
          <select
            value={selectedSnapshot}
            onChange={e => setSelectedSnapshot(e.target.value)}
            className="text-xs border border-gray-300 rounded px-2 py-1"
          >
            <option value="">选择快照...</option>
            {snapshots.map(s => (
              <option key={s.id} value={s.id}>
                {s.label} ({new Date(s.timestamp).toLocaleString('zh-CN')})
              </option>
            ))}
          </select>
        )}

        <button
          onClick={() => setShowUnchanged(!showUnchanged)}
          className={`ml-auto flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
            showUnchanged ? 'text-gray-500 hover:text-gray-700' : 'text-blue-600 bg-blue-50'
          }`}
        >
          {showUnchanged ? <EyeOff size={12} /> : <Eye size={12} />}
          {showUnchanged ? '隐藏相同' : '显示全部'}
        </button>
      </div>

      {/* Diff 展示 */}
      <div className="flex-1 overflow-y-auto font-mono text-sm">
        {filteredLines.map((line, i) => (
          <div
            key={i}
            className={`flex px-4 py-0.5 ${
              line.type === 'added' ? 'bg-green-50' :
              line.type === 'removed' ? 'bg-red-50' : ''
            }`}
          >
            <span className="w-8 text-xs text-gray-400 flex-shrink-0 select-none">
              {line.lineNum}
            </span>
            <span className={`w-4 flex-shrink-0 text-center select-none ${
              line.type === 'added' ? 'text-green-600' :
              line.type === 'removed' ? 'text-red-500' : 'text-gray-300'
            }`}>
              {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
            </span>
            <span className={`${
              line.type === 'added' ? 'text-green-800 bg-green-100' :
              line.type === 'removed' ? 'text-red-800 bg-red-100 line-through' :
              'text-gray-600'
            } px-1 rounded`}>
              {line.text}
            </span>
          </div>
        ))}
      </div>

      {/* 底部操作 */}
      {compareText && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={handleApplyAll}
            className="w-full py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            应用全部修改
          </button>
        </div>
      )}
    </div>
  );
}
