'use client';

import { useState } from 'react';
import { ResumeEditor } from '@/components/ResumeEditor';
import { SuggestionPanel } from '@/components/SuggestionPanel';
import { DiffViewer } from '@/components/DiffViewer';
import { KeywordExtractor } from '@/components/KeywordExtractor';
import { InterviewPanel } from '@/components/InterviewPanel';
import { QuantifyModal } from '@/components/QuantifyModal';
import { StarExpander } from '@/components/StarExpander';
import { Toolbar } from '@/components/Toolbar';
import { useStore } from '@/store/useStore';
import {
  MessageSquareText, ArrowLeftRight, Target, AlertTriangle,
  Sparkles, Shield, X, MessageCircle,
} from 'lucide-react';

export default function Home() {
  const activePanel = useStore(s => s.activePanel);
  const setActivePanel = useStore(s => s.setActivePanel);
  const showAdvanced = useStore(s => s.showAdvanced);
  const setShowAdvanced = useStore(s => s.setShowAdvanced);
  const homogeneity = useStore(s => s.homogeneity);
  const resumeText = useStore(s => s.resumeText);
  const setResumeText = useStore(s => s.setResumeText);
  const addSnapshot = useStore(s => s.addSnapshot);
  const exportReminderDismissed = useStore(s => s.exportReminderDismissed);
  const setExportReminderDismissed = useStore(s => s.setExportReminderDismissed);
  const loading = useStore(s => s.loading);

  const [showExportReminder, setShowExportReminder] = useState(false);
  const [uniqueAchievement, setUniqueAchievement] = useState('');

  const handleAddUniqueAchievement = () => {
    if (uniqueAchievement.trim()) {
      addSnapshot('添加独特成就前自动保存');
      setResumeText(resumeText + '\n\n🏆 独特成就：' + uniqueAchievement.trim());
      setUniqueAchievement('');
      setShowExportReminder(false);
    }
  };

  const tabs = [
    { id: 'suggestions' as const, label: '润色建议', icon: MessageSquareText },
    { id: 'diff' as const, label: '前后对比', icon: ArrowLeftRight },
    { id: 'ats' as const, label: 'ATS 匹配', icon: Target },
    { id: 'detect' as const, label: '深度检测', icon: AlertTriangle },
    { id: 'interview' as const, label: '面试模拟', icon: MessageCircle },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* 顶部标题栏 */}
      <header className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-blue-500" />
          <h1 className="text-base font-bold text-gray-800">运营简历精修工坊</h1>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Resume Polisher</span>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-xs text-blue-500 animate-pulse flex items-center gap-1">
              <Sparkles size={12} /> AI 处理中...
            </span>
          )}
        </div>
      </header>

      {/* 工具栏 */}
      <Toolbar />

      {/* 高级面板 */}
      {showAdvanced && (
        <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              运营专属深度功能
            </h3>
            <button onClick={() => setShowAdvanced(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            {/* 同质化警告 */}
            {homogeneity && (
              <div className={`p-3 rounded-xl border ${homogeneity.score > 60 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                <div className="flex items-center gap-1 font-semibold mb-1">
                  <Shield size={14} />
                  同质化评分: {homogeneity.score}/100
                </div>
                {homogeneity.score > 60 && (
                  <p className="text-red-600">⚠️ 简历相似度过高，建议增加独特成就</p>
                )}
                {homogeneity.warnings.slice(0, 2).map((w, i) => (
                  <p key={i} className="text-gray-600 mt-1">• {w}</p>
                ))}
              </div>
            )}
            {/* 快速入口 */}
            <div className="p-3 bg-white rounded-xl border border-gray-200">
              <div className="font-semibold text-gray-700 mb-2">💡 差异化建议</div>
              {homogeneity?.suggestions.slice(0, 2).map((s, i) => (
                <p key={i} className="text-gray-600 mb-1">• {s}</p>
              ))}
              <button
                onClick={() => setShowExportReminder(true)}
                className="mt-2 text-blue-600 hover:text-blue-800 font-medium"
              >
                + 添加独特成就
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 主内容区：左右分屏 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 左侧：编辑器 */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col bg-white">
          <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">📝 原始简历编辑区</span>
          </div>
          <ResumeEditor />
        </div>

        {/* 右侧：结果面板 */}
        <div className="w-1/2 flex flex-col bg-white">
          {/* 标签切换 */}
          <div className="flex items-center border-b border-gray-100 bg-gray-50 flex-shrink-0">
            <div className="flex px-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActivePanel(tab.id)}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition-colors border-b-2 -mb-[1px] ${
                      activePanel === tab.id
                        ? 'border-blue-500 text-blue-700 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 面板内容 */}
          <div className="flex-1 overflow-hidden">
            {activePanel === 'suggestions' && <SuggestionPanel />}
            {activePanel === 'diff' && <DiffViewer />}
            {activePanel === 'ats' && <KeywordExtractor />}
            {activePanel === 'detect' && <DetectPanel />}
            {activePanel === 'interview' && <InterviewPanel />}
          </div>
        </div>
      </div>

      {/* 模态框 */}
      <QuantifyModal />
      <StarExpander />

      {/* 导出前同质化提醒弹窗 */}
      {showExportReminder && !exportReminderDismissed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={20} className="text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-800">拒绝同质化 ✨</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              您是否添加了独特的个人成就？运营简历中，&ldquo;首次尝试&rdquo;、&ldquo;从0到1&rdquo;、&ldquo;低于平均成本X%&rdquo;等独特经历能让您脱颖而出。
            </p>
            <textarea
              value={uniqueAchievement}
              onChange={e => setUniqueAchievement(e.target.value)}
              placeholder="例如：首次在公司内部搭建用户生命周期管理体系，将30日留存从12%提升至28%..."
              className="w-full h-24 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddUniqueAchievement}
                className="flex-1 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors"
              >
                添加成就
              </button>
              <button
                onClick={() => {
                  setShowExportReminder(false);
                  setExportReminderDismissed(true);
                }}
                className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                暂不需要
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** 深度检测面板 */
function DetectPanel() {
  const chainIssues = useStore(s => s.chainIssues);
  const homogeneity = useStore(s => s.homogeneity);
  const setQuantifySelectedText = useStore(s => s.setQuantifySelectedText);
  const setQuantifyModalOpen = useStore(s => s.setQuantifyModalOpen);

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 space-y-4">
      {/* 链路过短检测 */}
      {chainIssues.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
            <AlertTriangle size={16} className="text-orange-500" />
            链路过短检测 ({chainIssues.length})
          </h4>
          <div className="space-y-2">
            {chainIssues.map(issue => (
              <div key={issue.id} className="p-3 bg-orange-50 rounded-xl border border-orange-200">
                <p className="text-sm font-medium text-orange-800">
                  ⚠️ &ldquo;{issue.sentence}&rdquo;
                </p>
                <p className="text-xs text-orange-600 mt-1">问题：{issue.reason}</p>
                <p className="text-xs text-gray-600 mt-1 italic">{issue.suggestion}</p>
                <button
                  onClick={() => {
                    setQuantifySelectedText(issue.sentence);
                    setQuantifyModalOpen(true);
                  }}
                  className="mt-2 text-xs font-medium text-orange-600 hover:text-orange-800 flex items-center gap-1"
                >
                  <Sparkles size={12} /> 调用量化魔法棒补充数据
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 同质化检测 */}
      {homogeneity && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
            <Shield size={16} className="text-purple-500" />
            同质化检测
          </h4>
          <div className={`p-4 rounded-xl border ${homogeneity.score > 60 ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold">相似度评分</span>
              <span className={`text-xl font-bold ${homogeneity.score > 60 ? 'text-red-600' : 'text-yellow-600'}`}>
                {homogeneity.score}/100
              </span>
            </div>
            {homogeneity.score > 60 && (
              <p className="text-xs text-red-600 mb-3">⚠️ 您的简历与通用运营模板相似度过高</p>
            )}
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-600">检测到的通用表述：</p>
              {homogeneity.warnings.map((w, i) => (
                <p key={i} className="text-xs text-gray-500">• {w}</p>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-medium text-gray-600 mb-1">💡 改进建议：</p>
              {homogeneity.suggestions.map((s, i) => (
                <p key={i} className="text-xs text-gray-600">• {s}</p>
              ))}
            </div>
          </div>
        </div>
      )}

      {chainIssues.length === 0 && !homogeneity && (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
          <AlertTriangle size={32} />
          <p className="text-sm">点击工具栏&ldquo;残缺检测&rdquo;开始分析</p>
          <p className="text-xs">检测链路过短 + 同质化风险</p>
        </div>
      )}
    </div>
  );
}
