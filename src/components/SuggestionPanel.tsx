'use client';

import { useStore } from '@/store/useStore';
import { Check, X, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export function SuggestionPanel() {
  const allSuggestions = useStore(s => s.allSuggestions);
  const grammarChanges = useStore(s => s.grammarChanges);
  const verbChanges = useStore(s => s.verbChanges);
  const quantifyTemplates = useStore(s => s.quantifyTemplates);
  const chainIssues = useStore(s => s.chainIssues);
  const setResumeText = useStore(s => s.setResumeText);
  const resumeText = useStore(s => s.resumeText);
  const setQuantifyModalOpen = useStore(s => s.setQuantifyModalOpen);
  const setQuantifySelectedText = useStore(s => s.setQuantifySelectedText);
  const addSnapshot = useStore(s => s.addSnapshot);

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    grammar: true,
    verbs: true,
    quantify: true,
    chain: true,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const applyChange = (original: string, enhanced: string) => {
    addSnapshot('应用建议前自动保存');
    const newText = resumeText.replace(original, enhanced);
    setResumeText(newText);
  };

  const applyAll = (changes: { original: string; enhanced: string }[]) => {
    addSnapshot('批量应用前自动保存');
    let newText = resumeText;
    for (const change of changes) {
      if (newText.includes(change.original)) {
        newText = newText.replace(change.original, change.enhanced);
      }
    }
    setResumeText(newText);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const hasContent = grammarChanges.length > 0 || verbChanges.length > 0 ||
    quantifyTemplates.length > 0 || chainIssues.length > 0;

  if (!hasContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
        <Copy size={32} />
        <p className="text-sm">点击上方工具栏开始润色</p>
        <p className="text-xs">语法纠错 · 动词强化 · 量化魔法棒 · STAR 扩展</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-4 space-y-3">

        {/* 语法纠错 */}
        {grammarChanges.length > 0 && (
          <SectionCard
            title={`语法纠错 (${grammarChanges.length})`}
            color="blue"
            expanded={expandedSections.grammar}
            onToggle={() => toggleSection('grammar')}
            onApplyAll={() => applyAll(grammarChanges.map(g => ({ original: g.original, enhanced: g.fixed })))}
          >
            {grammarChanges.map(change => (
              <ChangeItem
                key={change.id}
                original={change.original}
                enhanced={change.fixed}
                explanation={change.explanation}
                onApply={() => applyChange(change.original, change.fixed)}
              />
            ))}
          </SectionCard>
        )}

        {/* 动词强化 */}
        {verbChanges.length > 0 && (
          <SectionCard
            title={`动词强化 (${verbChanges.length})`}
            color="green"
            expanded={expandedSections.verbs}
            onToggle={() => toggleSection('verbs')}
            onApplyAll={() => applyAll(verbChanges.map(v => ({ original: v.original, enhanced: v.enhanced })))}
          >
            {verbChanges.map(change => (
              <ChangeItem
                key={change.id}
                original={change.original}
                enhanced={change.enhanced}
                explanation={change.reason}
                onApply={() => applyChange(change.original, change.enhanced)}
              />
            ))}
          </SectionCard>
        )}

        {/* 量化模板 */}
        {quantifyTemplates.length > 0 && (
          <SectionCard
            title={`量化模板 (${quantifyTemplates.length})`}
            color="purple"
            expanded={expandedSections.quantify}
            onToggle={() => toggleSection('quantify')}
          >
            {quantifyTemplates.map(template => (
              <div key={template.id} className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-sm text-purple-800 font-mono">{template.template}</div>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-purple-500 bg-purple-100 px-2 py-0.5 rounded-full">
                    {template.category === 'absolute' ? '📊 绝对数值' :
                     template.category === 'growth' ? '📈 增长率' : '⚡ 效率型'}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => copyToClipboard(template.template)}
                      className="text-xs text-purple-600 hover:text-purple-800 px-2 py-0.5 rounded hover:bg-purple-100"
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      onClick={() => {
                        setQuantifySelectedText(template.template);
                        setQuantifyModalOpen(true);
                      }}
                      className="text-xs text-purple-600 hover:text-purple-800 px-2 py-0.5 rounded hover:bg-purple-100 font-medium"
                    >
                      填写 →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </SectionCard>
        )}

        {/* 链路过短检测 */}
        {chainIssues.length > 0 && (
          <SectionCard
            title={`链路过短检测 (${chainIssues.length})`}
            color="orange"
            expanded={expandedSections.chain}
            onToggle={() => toggleSection('chain')}
          >
            {chainIssues.map(issue => (
              <div key={issue.id} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-800 font-medium">⚠️ {issue.sentence}</p>
                <p className="text-xs text-orange-600 mt-1">{issue.reason}</p>
                <p className="text-xs text-orange-700 mt-1 italic">{issue.suggestion}</p>
              </div>
            ))}
          </SectionCard>
        )}

      </div>
    </div>
  );
}

/** 折叠卡片 */
function SectionCard({
  title, color, expanded, onToggle, onApplyAll, children,
}: {
  title: string;
  color: string;
  expanded: boolean;
  onToggle: () => void;
  onApplyAll?: () => void;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    purple: 'bg-purple-50 border-purple-200',
    orange: 'bg-orange-50 border-orange-200',
  };

  return (
    <div className={`rounded-xl border ${colorMap[color] || 'bg-gray-50 border-gray-200'}`}>
      <div className="flex items-center justify-between px-3 py-2">
        <button onClick={onToggle} className="flex items-center gap-1 text-sm font-semibold text-gray-700">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          {title}
        </button>
        {onApplyAll && (
          <button
            onClick={onApplyAll}
            className="text-xs text-white bg-green-600 hover:bg-green-700 px-2.5 py-1 rounded-full font-medium transition-colors"
          >
            全部应用
          </button>
        )}
      </div>
      {expanded && <div className="px-3 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

/** 单个修改条目 */
function ChangeItem({
  original, enhanced, explanation, onApply,
}: {
  original: string;
  enhanced: string;
  explanation?: string;
  onApply: () => void;
}) {
  return (
    <div className="p-3 bg-white rounded-lg border border-gray-200">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-red-500 line-through mb-1">{original}</div>
          <div className="text-sm text-green-700 font-medium">{enhanced}</div>
          {explanation && (
            <div className="text-xs text-gray-400 mt-1">{explanation}</div>
          )}
        </div>
        <button
          onClick={onApply}
          className="flex-shrink-0 p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          title="应用此修改"
        >
          <Check size={16} />
        </button>
      </div>
    </div>
  );
}
