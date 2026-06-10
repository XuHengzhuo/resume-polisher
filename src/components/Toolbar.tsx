'use client';

import { useState } from 'react';
import {
  SpellCheck, Wand2, Star, Search, Settings2,
  ChevronDown, Copy, History, RotateCcw, MessageCircle,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { OpsDirection } from '@/types';
import { ExportModal } from './ExportModal';
import { batchSafeReplace, cleanRecursiveDuplication } from '@/lib/dedup';
import { polishGrammar, polishVerbs, polishQuantify, detectChain } from '@/lib/api-client';

const DIRECTIONS: { value: OpsDirection; label: string }[] = [
  { value: 'user_ops', label: '👤 用户运营' },
  { value: 'activity_ops', label: '🎪 活动运营' },
  { value: 'content_ops', label: '📝 内容运营' },
  { value: 'community_ops', label: '💬 社群运营' },
  { value: 'social_ops', label: '📱 新媒体运营' },
  { value: 'data_ops', label: '📊 数据运营' },
];

export function Toolbar() {
  const setResumeText = useStore(s => s.setResumeText);
  const resumeText = useStore(s => s.resumeText);
  const direction = useStore(s => s.direction);
  const setDirection = useStore(s => s.setDirection);
  const setGrammarChanges = useStore(s => s.setGrammarChanges);
  const setVerbChanges = useStore(s => s.setVerbChanges);
  const setQuantifyTemplates = useStore(s => s.setQuantifyTemplates);
  const setStarResult = useStore(s => s.setStarResult);
  const setChainIssues = useStore(s => s.setChainIssues);
  const setHomogeneity = useStore(s => s.setHomogeneity);
  const setActivePanel = useStore(s => s.setActivePanel);
  const setQuantifyModalOpen = useStore(s => s.setQuantifyModalOpen);
  const setStarModalOpen = useStore(s => s.setStarModalOpen);
  const setPolishedText = useStore(s => s.setPolishedText);
  const addSnapshot = useStore(s => s.addSnapshot);
  const refreshSuggestions = useStore(s => s.refreshSuggestions);
  const setLoading = useStore(s => s.setLoading);
  const showAdvanced = useStore(s => s.showAdvanced);
  const setShowAdvanced = useStore(s => s.setShowAdvanced);
  const snapshots = useStore(s => s.snapshots);

  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  const handleGrammarCheck = async () => {
    addSnapshot('语法纠错前自动保存');
    setLoading(true);
    const data = await polishGrammar(resumeText);
    setLoading(false);
    if (data.success) {
      setGrammarChanges(data.data.changes);
      refreshSuggestions();
      setActivePanel('suggestions');
    }
  };

  const handleVerbEnhance = async () => {
    addSnapshot('动词强化前自动保存');
    setLoading(true);
    const data = await polishVerbs(resumeText, direction);
    setLoading(false);
    if (data.success) {
      setVerbChanges(data.data.changes);
      refreshSuggestions();
      setActivePanel('suggestions');
    }
  };

  const handleQuantify = async () => {
    setLoading(true);
    const data = await polishQuantify(resumeText);
    setLoading(false);
    if (data.success) {
      setQuantifyTemplates(data.data.templates);
      refreshSuggestions();
      setActivePanel('suggestions');
      setQuantifyModalOpen(true);
    }
  };

  const handleStarExpand = () => {
    setStarModalOpen(true);
  };

  const handleChainDetect = async () => {
    setLoading(true);
    const data = await detectChain(resumeText);
    setLoading(false);
    if (data.success) {
      setChainIssues(data.data.issues);
      setHomogeneity(data.data.homogeneity);
      refreshSuggestions();
      setActivePanel('detect');
    }
  };

  const handleOneClickPolish = async () => {
    addSnapshot('一键润色前自动保存');
    setLoading(true);
    try {
      const [grammarRes, verbsRes] = await Promise.all([
        polishGrammar(resumeText),
        polishVerbs(resumeText, direction),
      ]);

      let polished = resumeText;

      // 先收集所有语法修改（防重复替换）
      if (grammarRes.success) {
        setGrammarChanges(grammarRes.data.changes);
        const grammarResult = batchSafeReplace(
          polished,
          grammarRes.data.changes.map((c: { original: string; fixed: string }) => ({
            original: c.original, replacement: c.fixed,
          }))
        );
        polished = grammarResult.text;
      }
      // 再收集动词修改，跳过已应用的
      if (verbsRes.success) {
        setVerbChanges(verbsRes.data.changes);
        const verbResult = batchSafeReplace(
          polished,
          verbsRes.data.changes.map((c: { original: string; enhanced: string }) => ({
            original: c.original, replacement: c.enhanced,
          }))
        );
        polished = verbResult.text;
      }
      // 最终清理递归嵌套短语
      polished = cleanRecursiveDuplication(polished);

      setPolishedText(polished);
      setResumeText(polished);
      refreshSuggestions();
      setActivePanel('diff');
    } catch {
      alert('一键润色失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(resumeText);
  };

  const handleUndo = () => {
    if (snapshots.length > 0) {
      const last = snapshots[snapshots.length - 1];
      useStore.getState().restoreSnapshot(last.id);
    }
  };

  return (
    <div className="border-b border-gray-200 bg-white flex-shrink-0">
      {/* 主工具栏 — 仅桌面端可见 */}
      <div className="hidden md:flex items-center gap-1 px-3 py-2 overflow-x-auto">
        {/* 运营方向选择 */}
        <div className="relative group">
          <select
            value={direction}
            onChange={e => setDirection(e.target.value as OpsDirection)}
            className="appearance-none text-xs font-medium bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 pr-6 hover:bg-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {DIRECTIONS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* 一键润色 */}
        <button
          onClick={handleOneClickPolish}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-lg transition-all shadow-sm hover:shadow-md"
        >
          <Wand2 size={14} /> 一键润色
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* 语法纠错 */}
        <button
          onClick={handleGrammarCheck}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <SpellCheck size={14} /> 语法纠错
        </button>

        {/* 动词强化 */}
        <button
          onClick={handleVerbEnhance}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Wand2 size={14} /> 动词强化
        </button>

        {/* 量化魔法棒 */}
        <button
          onClick={handleQuantify}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-300 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <Star size={14} /> 量化魔法棒
        </button>

        {/* STAR 扩展器 */}
        <button
          onClick={handleStarExpand}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Star size={14} /> STAR 扩展
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* 链路过短检测 */}
        <button
          onClick={handleChainDetect}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Search size={14} /> 残缺检测
        </button>

        {/* 面试模拟 */}
        <button
          onClick={() => setActivePanel('interview')}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <MessageCircle size={14} /> 面试模拟
        </button>

        {/* 撤销 */}
        <button
          onClick={handleUndo}
          disabled={snapshots.length === 0}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="撤销上一步操作"
        >
          <RotateCcw size={14} />
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1" />

        {/* 复制全部 */}
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Copy size={14} /> 复制
        </button>

        {/* 导出 */}
        <ExportModal />

        {/* 历史 */}
        <button
          onClick={() => setShowHistoryPanel(!showHistoryPanel)}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <History size={14} /> 历史
        </button>

        {/* 高级面板切换 */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ml-auto ${
            showAdvanced ? 'text-blue-700 bg-blue-50 border border-blue-300' : 'text-gray-500 bg-white border border-gray-200 hover:bg-gray-50'
          }`}
        >
          <Settings2 size={14} /> 高级
        </button>
      </div>

      {/* 历史快照面板 — 仅桌面端可见 */}
      {showHistoryPanel && snapshots.length > 0 && (
        <div className="hidden md:block border-t border-gray-200 bg-gray-50 px-3 py-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-600">历史快照 (最近5次)</span>
            <button
              onClick={() => useStore.getState().clearSnapshots()}
              className="text-xs text-red-400 hover:text-red-600"
            >
              清空
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {[...snapshots].reverse().map(s => (
              <button
                key={s.id}
                onClick={() => {
                  useStore.getState().restoreSnapshot(s.id);
                  setShowHistoryPanel(false);
                }}
                className="flex-shrink-0 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="font-medium text-gray-700">{s.label}</div>
                <div className="text-gray-400">{new Date(s.timestamp).toLocaleTimeString('zh-CN')}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
