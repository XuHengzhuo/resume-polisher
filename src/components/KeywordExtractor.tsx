'use client';

import { useState } from 'react';
import { Search, Plus, AlertCircle, CheckCircle2, Target, BarChart3 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { AtsKeyword } from '@/types';
import { atsKeywords as fetchAtsKeywords, atsMatch as fetchAtsMatch } from '@/lib/api-client';

export function KeywordExtractor() {
  const jdText = useStore(s => s.jdText);
  const setJdText = useStore(s => s.setJdText);
  const atsKeywords = useStore(s => s.atsKeywords);
  const setAtsKeywords = useStore(s => s.setAtsKeywords);
  const atsScore = useStore(s => s.atsScore);
  const setAtsScore = useStore(s => s.setAtsScore);
  const resumeText = useStore(s => s.resumeText);
  const setResumeText = useStore(s => s.setResumeText);
  const addSnapshot = useStore(s => s.addSnapshot);
  const setLoading = useStore(s => s.setLoading);

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [missingKeywords, setMissingKeywords] = useState<AtsKeyword[]>([]);

  const handleExtract = async () => {
    if (!jdText.trim()) return;
    setLoading(true);
    const data = await fetchAtsKeywords(jdText);
    setLoading(false);
    if (data.success) {
      setAtsKeywords(data.data.keywords);
      setSuggestions(data.data.suggestions || []);
    }
  };

  const handleMatch = async () => {
    if (!jdText.trim() || !resumeText.trim()) return;
    setLoading(true);
    const data = await fetchAtsMatch(resumeText, jdText);
    setLoading(false);
    if (data.success) {
      setAtsScore(data.data.score);
      setMissingKeywords(data.data.missingKeywords || []);
    }
  };

  const insertKeyword = (keyword: string) => {
    addSnapshot('插入关键词前自动保存');
    setResumeText(resumeText + `\n• 熟练运用${keyword}模型进行运营数据分析与策略制定`);
  };

  const getCategoryLabel = (cat: string) => {
    const map: Record<string, string> = { model: '模型', metric: '指标', tool: '工具', skill: '技能' };
    return map[cat] || cat;
  };

  const getCategoryColor = (cat: string) => {
    const map: Record<string, string> = {
      model: 'bg-blue-100 text-blue-700',
      metric: 'bg-green-100 text-green-700',
      tool: 'bg-purple-100 text-purple-700',
      skill: 'bg-orange-100 text-orange-700',
    };
    return map[cat] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {/* JD 输入 */}
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <Target size={14} /> 目标岗位 JD
        </label>
        <textarea
          value={jdText}
          onChange={e => setJdText(e.target.value)}
          placeholder="在此粘贴目标岗位的 JD（职位描述）..."
          className="mt-1 w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
        />
        <div className="flex gap-2 mt-2">
          <button
            onClick={handleExtract}
            disabled={!jdText.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg transition-colors"
          >
            <Search size={14} /> 提取关键词
          </button>
          <button
            onClick={handleMatch}
            disabled={!jdText.trim() || !resumeText.trim()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-300 rounded-lg transition-colors"
          >
            <BarChart3 size={14} /> 计算匹配度
          </button>
        </div>
      </div>

      {/* 匹配度分数 */}
      {atsScore > 0 && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">关键词匹配度</span>
            <span className={`text-2xl font-bold ${atsScore >= 70 ? 'text-green-600' : atsScore >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {atsScore}
            </span>
          </div>
          <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${atsScore}%`,
                backgroundColor: atsScore >= 70 ? '#22c55e' : atsScore >= 40 ? '#f59e0b' : '#ef4444',
              }}
            />
          </div>
        </div>
      )}

      {/* 关键词列表 */}
      {atsKeywords.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            提取的关键词 ({atsKeywords.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {atsKeywords.map(k => (
              <span
                key={k.keyword}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                  k.found ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-500'
                }`}
              >
                {k.found ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                {k.keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 缺失关键词 + 插入建议 */}
      {(missingKeywords.length > 0) && (
        <div className="p-4 bg-orange-50 rounded-xl border border-orange-200">
          <h4 className="text-sm font-semibold text-orange-800 flex items-center gap-1 mb-3">
            <AlertCircle size={16} /> 缺失关键词 ({missingKeywords.length})
          </h4>
          <div className="space-y-2">
            {missingKeywords.map(kw => (
              <div key={kw.keyword} className="flex items-center justify-between p-2 bg-white rounded-lg border border-orange-100">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getCategoryColor(kw.category)}`}>
                    {getCategoryLabel(kw.category)}
                  </span>
                  <span className="text-sm font-medium text-gray-800">{kw.keyword}</span>
                </div>
                <button
                  onClick={() => insertKeyword(kw.keyword)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded transition-colors"
                >
                  <Plus size={12} /> 插入
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 插入建议 */}
      {suggestions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">优化建议</h4>
          <div className="space-y-1">
            {suggestions.map((s, i) => (
              <p key={i} className="text-xs text-gray-600 flex items-start gap-1">
                <span className="text-blue-400 mt-0.5">▸</span> {s}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
