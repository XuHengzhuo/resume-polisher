'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { InterviewQuestion } from '@/lib/mock-ai';
import { interviewQuestions } from '@/lib/api-client';
import { MessageCircle, ChevronDown, ChevronRight, Lightbulb, CheckCircle2, Sparkles } from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  data: { label: '📊 数据追问', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  method: { label: '🔬 方法论深挖', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  scenario: { label: '🎯 情境模拟', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  detail: { label: '🔍 项目细节', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
};

export function InterviewPanel() {
  const resumeText = useStore(s => s.resumeText);
  const setLoading = useStore(s => s.setLoading);

  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [hasGenerated, setHasGenerated] = useState(false);

  const handleGenerate = async () => {
    if (!resumeText.trim()) return;
    setLoading(true);
    const data = await interviewQuestions(resumeText);
    setLoading(false);
    if (data.success) {
      setQuestions(data.data.questions);
      setHasGenerated(true);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCheck = (id: string) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setExpandedIds(prev => {
      if (prev.size === questions.length) return new Set();
      return new Set(questions.map(q => q.id));
    });
  };

  // 按类别分组
  const grouped: Record<string, InterviewQuestion[]> = {};
  for (const q of questions) {
    if (!grouped[q.category]) grouped[q.category] = [];
    grouped[q.category].push(q);
  }

  const completedCount = checkedIds.size;
  const progress = questions.length > 0 ? Math.round((completedCount / questions.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* 顶部操作区 */}
      <div className="p-4 border-b border-gray-100">
        {!hasGenerated ? (
          <div className="text-center py-8">
            <MessageCircle size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-4">
              基于当前简历内容，AI 生成面试官可能提问的模拟题
            </p>
            <button
              onClick={handleGenerate}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              <Sparkles size={16} />
              生成面试模拟题
            </button>
          </div>
        ) : (
          <>
            {/* 进度条 */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">
                面试模拟题 ({questions.length} 题)
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">
                  已准备: {completedCount}/{questions.length}
                </span>
                <button
                  onClick={toggleAll}
                  className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                >
                  {expandedIds.size === questions.length ? '收起全部' : '展开全部'}
                </button>
              </div>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mb-1">
              <div
                className="h-full bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <button
              onClick={handleGenerate}
              className="mt-3 text-xs text-indigo-500 hover:text-indigo-700 flex items-center gap-1"
            >
              <Sparkles size={12} /> 重新生成
            </button>
          </>
        )}
      </div>

      {/* 问题列表 */}
      {hasGenerated && (
        <div className="flex-1 p-4 space-y-4">
          {Object.entries(grouped).map(([category, qs]) => {
            const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.data;
            return (
              <div key={category}>
                <h4 className={`text-xs font-semibold mb-2 flex items-center gap-2 ${cfg.color}`}>
                  {cfg.label}
                  <span className="text-gray-400 font-normal">({qs.length})</span>
                </h4>
                <div className="space-y-2">
                  {qs.map(q => {
                    const isExpanded = expandedIds.has(q.id);
                    const isChecked = checkedIds.has(q.id);
                    return (
                      <div
                        key={q.id}
                        className={`rounded-xl border transition-all ${
                          isChecked
                            ? 'bg-green-50 border-green-300'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {/* 问题头部 */}
                        <button
                          onClick={() => toggleExpand(q.id)}
                          className="w-full flex items-start gap-2 p-3 text-left"
                        >
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleCheck(q.id); }}
                            className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-green-400'
                            }`}
                          >
                            {isChecked && <CheckCircle2 size={12} />}
                          </button>
                          <span className={`flex-1 text-sm ${isChecked ? 'text-green-800 line-through opacity-70' : 'text-gray-800'}`}>
                            {q.question}
                          </span>
                          <span className="flex-shrink-0 text-gray-400 mt-0.5">
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </span>
                        </button>

                        {/* 展开详情 */}
                        {isExpanded && (
                          <div className="px-3 pb-3 border-t border-gray-100">
                            {/* 提示 */}
                            <div className="mt-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                              <div className="flex items-start gap-1.5">
                                <Lightbulb size={14} className="text-yellow-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <span className="text-xs font-medium text-yellow-700">面试官意图</span>
                                  <p className="text-xs text-yellow-600 mt-0.5">{q.hint}</p>
                                </div>
                              </div>
                            </div>

                            {/* 答题要点 */}
                            <div className="mt-2">
                              <span className="text-xs font-medium text-gray-500">建议的回答要点：</span>
                              <ul className="mt-1 space-y-1">
                                {q.expectedPoints.map((point, i) => (
                                  <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                    <span className="text-indigo-400 mt-0.5">•</span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 底部提示 */}
          <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-xs text-indigo-600">
              💡 <strong>面试技巧：</strong>回答时使用 STAR 法则（情境-任务-行动-结果），数据用具体数字，不确定的不要说，诚实比完美更重要。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
