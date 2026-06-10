import { create } from 'zustand';
import {
  OpsDirection,
  GrammarChange,
  VerbChange,
  QuantifyTemplate,
  StarResult,
  AtsKeyword,
  ChainIssue,
  HomogeneityResult,
  Snapshot,
  Suggestion,
  DensityStats,
} from '@/types';
import { calcDensity } from '@/lib/density';
import { DEFAULT_RESUME_TEXT } from '@/lib/defaults';

interface AppState {
  // 简历文本
  resumeText: string;
  setResumeText: (text: string) => void;

  // JD 文本
  jdText: string;
  setJdText: (text: string) => void;

  // 运营方向
  direction: OpsDirection;
  setDirection: (d: OpsDirection) => void;

  // 右侧面板激活的标签
  activePanel: 'suggestions' | 'diff' | 'ats' | 'detect' | 'interview';
  setActivePanel: (p: 'suggestions' | 'diff' | 'ats' | 'detect' | 'interview') => void;

  // 语法纠错结果
  grammarChanges: GrammarChange[];
  setGrammarChanges: (changes: GrammarChange[]) => void;

  // 动词强化结果
  verbChanges: VerbChange[];
  setVerbChanges: (changes: VerbChange[]) => void;

  // 量化模板
  quantifyTemplates: QuantifyTemplate[];
  setQuantifyTemplates: (templates: QuantifyTemplate[]) => void;

  // STAR 结果
  starResult: StarResult | null;
  setStarResult: (r: StarResult | null) => void;

  // ATS 关键词
  atsKeywords: AtsKeyword[];
  setAtsKeywords: (k: AtsKeyword[]) => void;

  // ATS 匹配分数
  atsScore: number;
  setAtsScore: (s: number) => void;

  // 链路过短检测
  chainIssues: ChainIssue[];
  setChainIssues: (issues: ChainIssue[]) => void;

  // 同质化检测
  homogeneity: HomogeneityResult | null;
  setHomogeneity: (h: HomogeneityResult | null) => void;

  // 量化弹窗状态
  quantifyModalOpen: boolean;
  setQuantifyModalOpen: (open: boolean) => void;
  quantifySelectedText: string;
  setQuantifySelectedText: (text: string) => void;

  // STAR 弹窗状态
  starModalOpen: boolean;
  setStarModalOpen: (open: boolean) => void;

  // 高级面板
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;

  // 历史快照 (localStorage)
  snapshots: Snapshot[];
  addSnapshot: (label: string) => void;
  restoreSnapshot: (id: string) => void;
  clearSnapshots: () => void;

  // 所有润色建议（统一列表）
  allSuggestions: Suggestion[];
  refreshSuggestions: () => void;

  // 润色后的完整文本
  polishedText: string;
  setPolishedText: (text: string) => void;

  // 数据密度
  density: DensityStats;
  refreshDensity: () => void;

  // 加载状态
  loading: boolean;
  setLoading: (v: boolean) => void;

  // 导出弹窗
  exportModalOpen: boolean;
  setExportModalOpen: (v: boolean) => void;

  // 导出前提醒
  exportReminderDismissed: boolean;
  setExportReminderDismissed: (v: boolean) => void;
}

export const useStore = create<AppState>((set, get) => ({
  resumeText: DEFAULT_RESUME_TEXT,
  setResumeText: (text: string) => {
    set({ resumeText: text });
    get().refreshDensity();
  },

  jdText: '',
  setJdText: (text) => set({ jdText: text }),

  direction: 'user_ops',
  setDirection: (d) => set({ direction: d }),

  activePanel: 'suggestions',
  setActivePanel: (p) => set({ activePanel: p }),

  grammarChanges: [],
  setGrammarChanges: (changes) => set({ grammarChanges: changes }),

  verbChanges: [],
  setVerbChanges: (changes) => set({ verbChanges: changes }),

  quantifyTemplates: [],
  setQuantifyTemplates: (templates) => set({ quantifyTemplates: templates }),

  starResult: null,
  setStarResult: (r) => set({ starResult: r }),

  atsKeywords: [],
  setAtsKeywords: (k) => set({ atsKeywords: k }),

  atsScore: 0,
  setAtsScore: (s) => set({ atsScore: s }),

  chainIssues: [],
  setChainIssues: (issues) => set({ chainIssues: issues }),

  homogeneity: null,
  setHomogeneity: (h) => set({ homogeneity: h }),

  quantifyModalOpen: false,
  setQuantifyModalOpen: (open) => set({ quantifyModalOpen: open }),
  quantifySelectedText: '',
  setQuantifySelectedText: (text) => set({ quantifySelectedText: text }),

  starModalOpen: false,
  setStarModalOpen: (open) => set({ starModalOpen: open }),

  showAdvanced: false,
  setShowAdvanced: (show) => set({ showAdvanced: show }),

  snapshots: [],
  addSnapshot: (label: string) => {
    const { resumeText, snapshots } = get();
    if (snapshots.length >= 5) {
      snapshots.shift(); // 只保留最近5个
    }
    const newSnapshot: Snapshot = {
      id: Date.now().toString(36),
      timestamp: Date.now(),
      text: resumeText,
      label,
    };
    const updated = [...snapshots, newSnapshot];
    set({ snapshots: updated });
    localStorage.setItem('resume-polisher-snapshots', JSON.stringify(updated));
  },
  restoreSnapshot: (id: string) => {
    const { snapshots } = get();
    const snapshot = snapshots.find(s => s.id === id);
    if (snapshot) {
      get().addSnapshot('撤销前自动保存');
      set({ resumeText: snapshot.text });
      get().refreshDensity();
    }
  },
  clearSnapshots: () => {
    set({ snapshots: [] });
    localStorage.removeItem('resume-polisher-snapshots');
  },

  allSuggestions: [],
  refreshSuggestions: () => {
    const { grammarChanges, verbChanges, quantifyTemplates, chainIssues } = get();
    const suggestions: Suggestion[] = [
      ...grammarChanges.map(g => ({
        id: g.id,
        type: 'grammar' as const,
        original: g.original,
        enhanced: g.fixed,
        explanation: g.explanation,
        applied: g.applied,
      })),
      ...verbChanges.map(v => ({
        id: v.id,
        type: 'verb' as const,
        original: v.original,
        enhanced: v.enhanced,
        explanation: v.reason,
        applied: v.applied,
      })),
      ...quantifyTemplates.map(q => ({
        id: q.id,
        type: 'quantify' as const,
        original: '',
        enhanced: q.template,
        explanation: q.description,
        applied: false,
      })),
      ...chainIssues.map(c => ({
        id: c.id,
        type: 'chain' as const,
        original: c.sentence,
        enhanced: c.suggestion,
        explanation: c.reason,
        applied: false,
      })),
    ];
    set({ allSuggestions: suggestions });
  },

  polishedText: '',
  setPolishedText: (text) => set({ polishedText: text }),

  density: calcDensity(DEFAULT_RESUME_TEXT),
  refreshDensity: () => {
    set({ density: calcDensity(get().resumeText) });
  },

  loading: false,
  setLoading: (v) => set({ loading: v }),

  exportModalOpen: false,
  setExportModalOpen: (v) => set({ exportModalOpen: v }),

  exportReminderDismissed: false,
  setExportReminderDismissed: (v) => set({ exportReminderDismissed: v }),
}));
