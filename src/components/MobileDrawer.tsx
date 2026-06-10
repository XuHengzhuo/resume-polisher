'use client';

import { useState, useEffect } from 'react';
import {
  Wand2, SpellCheck, Star, Search, RotateCcw,
  Copy, History, Settings2, ChevronDown, MessageCircle,
  X, FileDown, Menu,
} from 'lucide-react';
import { useStore } from '@/store/useStore';
import { OpsDirection } from '@/types';
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

interface MobileDrawerProps {
  onClose: () => void;
}

export function MobileDrawer({ onClose }: MobileDrawerProps) {
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);

  const resumeText = useStore(s => s.resumeText);
  const direction = useStore(s => s.direction);
  const setDirection = useStore(s => s.setDirection);
  const setResumeText = useStore(s => s.setResumeText);
  const setPolishedText = useStore(s => s.setPolishedText);
  const setGrammarChanges = useStore(s => s.setGrammarChanges);
  const setVerbChanges = useStore(s => s.setVerbChanges);
  const setQuantifyTemplates = useStore(s => s.setQuantifyTemplates);
  const setChainIssues = useStore(s => s.setChainIssues);
  const setHomogeneity = useStore(s => s.setHomogeneity);
  const setActivePanel = useStore(s => s.setActivePanel);
  const setQuantifyModalOpen = useStore(s => s.setQuantifyModalOpen);
  const setStarModalOpen = useStore(s => s.setStarModalOpen);
  const addSnapshot = useStore(s => s.addSnapshot);
  const refreshSuggestions = useStore(s => s.refreshSuggestions);
  const setLoading = useStore(s => s.setLoading);
  const showAdvanced = useStore(s => s.showAdvanced);
  const setShowAdvanced = useStore(s => s.setShowAdvanced);
  const snapshots = useStore(s => s.snapshots);

  // 入场动画
  useEffect(() => {
    requestAnimationFrame(() => {
      setAnimating(true);
      setVisible(true);
    });
  }, []);

  const close = () => {
    setAnimating(false);
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const handleAction = (fn: () => void) => {
    fn();
    close();
  };

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
    close();
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
    close();
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
    close();
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
    close();
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
      if (grammarRes.success) {
        setGrammarChanges(grammarRes.data.changes);
        const gr = batchSafeReplace(polished,
          grammarRes.data.changes.map((c: { original: string; fixed: string }) => ({ original: c.original, replacement: c.fixed }))
        );
        polished = gr.text;
      }
      if (verbsRes.success) {
        setVerbChanges(verbsRes.data.changes);
        const vr = batchSafeReplace(polished,
          verbsRes.data.changes.map((c: { original: string; enhanced: string }) => ({ original: c.original, replacement: c.enhanced }))
        );
        polished = vr.text;
      }
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
    close();
  };

  const handleUndo = () => {
    if (snapshots.length > 0) {
      const last = snapshots[snapshots.length - 1];
      useStore.getState().restoreSnapshot(last.id);
    }
    close();
  };

  const handleCopyAll = () => {
    navigator.clipboard.writeText(resumeText);
    close();
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* 遮罩 */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />

      {/* 抽屉面板 */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-[280px] max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-250 ${
          animating ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-shrink-0">
          <span className="text-sm font-bold text-gray-800">功能菜单</span>
          <button onClick={close} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto py-2">
          {/* 运营方向 */}
          <div className="px-4 py-2">
            <label className="text-xs font-semibold text-gray-500 mb-1.5 block">运营方向</label>
            <div className="relative">
              <select
                value={direction}
                onChange={e => setDirection(e.target.value as OpsDirection)}
                className="w-full appearance-none text-sm bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 pr-6 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                {DIRECTIONS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
            </div>
          </div>

          <div className="border-t border-gray-100 mx-4 my-2" />

          {/* 功能按钮 */}
          <div className="space-y-1 px-2">
            <DrawerButton icon={<Wand2 size={16} />} label="一键润色" primary onClick={() => handleAction(handleOneClickPolish)} />
            <DrawerButton icon={<SpellCheck size={16} />} label="语法纠错" onClick={() => handleAction(handleGrammarCheck)} />
            <DrawerButton icon={<Wand2 size={16} />} label="动词强化" onClick={() => handleAction(handleVerbEnhance)} />
            <DrawerButton icon={<Star size={16} />} label="量化魔法棒" accent="purple" onClick={() => handleAction(handleQuantify)} />
            <DrawerButton icon={<Star size={16} />} label="STAR 扩展" accent="blue" onClick={() => setStarModalOpen(true)} />
            <DrawerButton icon={<Search size={16} />} label="残缺检测" onClick={() => handleAction(handleChainDetect)} />
            <DrawerButton icon={<MessageCircle size={16} />} label="面试模拟" accent="indigo" onClick={() => { setActivePanel('interview'); close(); }} />
          </div>

          <div className="border-t border-gray-100 mx-4 my-2" />

          {/* 工具按钮 */}
          <div className="space-y-1 px-2">
            <DrawerButton icon={<RotateCcw size={16} />} label="撤销" onClick={handleUndo} disabled={snapshots.length === 0} />
            <DrawerButton icon={<Copy size={16} />} label="复制全部" onClick={handleCopyAll} />
            <DrawerButton icon={<FileDown size={16} />} label="导出" onClick={() => { useStore.getState().setExportModalOpen(true); close(); }} />
            <DrawerButton icon={<History size={16} />} label="历史快照" onClick={() => setShowHistoryPanel(!showHistoryPanel)} />
            <DrawerButton
              icon={<Settings2 size={16} />}
              label="高级面板"
              onClick={() => { setShowAdvanced(!showAdvanced); close(); }}
              active={showAdvanced}
            />
          </div>

          {/* 历史快照展开 */}
          {showHistoryPanel && snapshots.length > 0 && (
            <div className="mx-4 mt-2 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-600">最近快照</span>
                <button onClick={() => useStore.getState().clearSnapshots()} className="text-xs text-red-400">清空</button>
              </div>
              <div className="space-y-1">
                {[...snapshots].reverse().map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      useStore.getState().restoreSnapshot(s.id);
                      setShowHistoryPanel(false);
                      close();
                    }}
                    className="w-full text-left px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs hover:bg-blue-50"
                  >
                    <div className="font-medium text-gray-700">{s.label}</div>
                    <div className="text-gray-400">{new Date(s.timestamp).toLocaleTimeString('zh-CN')}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

/** 抽屉按钮 */
function DrawerButton({
  icon, label, primary, accent, active, disabled, onClick,
}: {
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  accent?: 'purple' | 'blue' | 'indigo';
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  let cls = 'w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-colors';
  if (disabled) {
    cls += ' opacity-40 cursor-not-allowed text-gray-400';
  } else if (primary) {
    cls += ' text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-sm';
  } else if (active) {
    cls += ' text-blue-700 bg-blue-50 border border-blue-200';
  } else if (accent === 'purple') {
    cls += ' text-purple-700 hover:bg-purple-50';
  } else if (accent === 'blue') {
    cls += ' text-blue-700 hover:bg-blue-50';
  } else if (accent === 'indigo') {
    cls += ' text-indigo-700 hover:bg-indigo-50';
  } else {
    cls += ' text-gray-700 hover:bg-gray-50';
  }
  return (
    <button onClick={onClick} disabled={disabled} className={cls}>
      <span className="flex-shrink-0">{icon}</span>
      {label}
    </button>
  );
}
