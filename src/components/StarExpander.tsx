'use client';

import { useState } from 'react';
import { X, Sparkles, Copy, Check } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { StarScenario } from '@/types';
import { polishStar } from '@/lib/api-client';

const SCENARIOS: { value: StarScenario; label: string; emoji: string; desc: string }[] = [
  { value: 'acquisition', label: '拉新', emoji: '🎯', desc: '用户获取与增长' },
  { value: 'activation', label: '促活', emoji: '⚡', desc: '新用户激活' },
  { value: 'conversion', label: '转化', emoji: '💰', desc: '付费/注册转化' },
  { value: 'retention', label: '留存', emoji: '🔄', desc: '用户留存与召回' },
];

export function StarExpander() {
  const open = useStore(s => s.starModalOpen);
  const setOpen = useStore(s => s.setStarModalOpen);
  const starResult = useStore(s => s.starResult);
  const setStarResult = useStore(s => s.setStarResult);
  const resumeText = useStore(s => s.resumeText);
  const setResumeText = useStore(s => s.setResumeText);
  const addSnapshot = useStore(s => s.addSnapshot);
  const setLoading = useStore(s => s.setLoading);

  const [scenario, setScenario] = useState<StarScenario>('acquisition');
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const handleExpand = async () => {
    setLoading(true);
    const data = await polishStar(resumeText, scenario);
    setLoading(false);
    if (data.success) {
      setStarResult(data.data);
    }
  };

  const handleApply = () => {
    if (!starResult) return;
    addSnapshot('STAR扩展前自动保存');
    setResumeText(resumeText + '\n\n' + starResult.fullText);
    setOpen(false);
  };

  const handleCopy = () => {
    if (!starResult) return;
    navigator.clipboard.writeText(starResult.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-800">⭐ STAR 扩展器</h2>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* 场景选择 */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">选择运营情境</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {SCENARIOS.map(s => (
                <button
                  key={s.value}
                  onClick={() => setScenario(s.value)}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    scenario === s.value
                      ? 'border-blue-500 bg-blue-50 shadow-md'
                      : 'border-gray-200 hover:border-blue-200 bg-white'
                  }`}
                >
                  <div className="text-lg">{s.emoji}</div>
                  <div className="font-semibold text-sm text-gray-800">{s.label}</div>
                  <div className="text-xs text-gray-400">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 展开按钮 */}
          <button
            onClick={handleExpand}
            className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium rounded-xl hover:from-blue-600 hover:to-cyan-600 transition-all shadow-md hover:shadow-lg"
          >
            <Sparkles size={16} className="inline mr-1" />
            展开为 STAR 结构
          </button>

          {/* STAR 结果 */}
          {starResult && (
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 space-y-3">
              <div className="space-y-2">
                <StarBlock letter="S" title="Situation (背景)" content={starResult.situation} color="bg-red-100 text-red-700" />
                <StarBlock letter="T" title="Task (任务)" content={starResult.task} color="bg-yellow-100 text-yellow-700" />
                <StarBlock letter="A" title="Action (行动)" content={starResult.action} color="bg-green-100 text-green-700" />
                <StarBlock letter="R" title="Result (结果)" content={starResult.result} color="bg-blue-100 text-blue-700" />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                <button
                  onClick={handleApply}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Check size={14} /> 插入简历
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? '已复制' : '复制全文'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StarBlock({ letter, title, content, color }: {
  letter: string;
  title: string;
  content: string;
  color: string;
}) {
  return (
    <div className="flex gap-3">
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${color}`}>
        {letter}
      </div>
      <div className="flex-1">
        <div className="text-xs font-semibold text-gray-500 mb-0.5">{title}</div>
        <p className="text-sm text-gray-800">{content}</p>
      </div>
    </div>
  );
}
