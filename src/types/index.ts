// ============================================================
// 运营简历精修工坊 - Type Definitions
// ============================================================

/** 运营细分方向 */
export type OpsDirection =
  | 'user_ops'      // 用户运营
  | 'activity_ops'  // 活动运营
  | 'content_ops'   // 内容运营
  | 'community_ops' // 社群运营
  | 'social_ops'    // 新媒体运营
  | 'data_ops';     // 数据运营

/** STAR 场景 */
export type StarScenario = 'acquisition' | 'activation' | 'conversion' | 'retention';

/** 语法变更条目 */
export interface GrammarChange {
  id: string;
  original: string;
  fixed: string;
  explanation: string;
  applied: boolean;
}

/** 动词强化条目 */
export interface VerbChange {
  id: string;
  original: string;
  enhanced: string;
  reason: string;
  applied: boolean;
}

/** 量化模板 */
export interface QuantifyTemplate {
  id: string;
  template: string;
  description: string;
  category: 'absolute' | 'growth' | 'efficiency';
}

/** STAR 结果 */
export interface StarResult {
  situation: string;
  task: string;
  action: string;
  result: string;
  fullText: string;
}

/** ATS 关键词 */
export interface AtsKeyword {
  keyword: string;
  category: 'model' | 'metric' | 'tool' | 'skill';
  found: boolean;
}

/** 链路过短检测结果 */
export interface ChainIssue {
  id: string;
  sentence: string;
  reason: string;
  suggestion: string;
}

/** 同质化检测结果 */
export interface HomogeneityResult {
  score: number;        // 0-100, higher = more generic
  warnings: string[];
  suggestions: string[];
}

/** 历史快照 */
export interface Snapshot {
  id: string;
  timestamp: number;
  text: string;
  label: string;
}

/** 润色建议（统一类型） */
export interface Suggestion {
  id: string;
  type: 'grammar' | 'verb' | 'quantify' | 'star' | 'chain';
  original: string;
  enhanced: string;
  explanation?: string;
  applied: boolean;
}

/** API 通用响应 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** 数据密度统计 */
export interface DensityStats {
  charCount: number;
  lineCount: number;
  numberCount: number;
  density: number; // 每100字含数字个数
}

// ============================================================
// 简历解析相关类型 (PDF 导出用)
// ============================================================

/** 简历解析结果 */
export interface ParsedResume {
  header: ResumeHeader;
  sections: ResumeSection[];
}

/** 个人信息头部 */
export interface ResumeHeader {
  name: string;
  phone?: string;
  email?: string;
  location?: string;
}

/** 简历板块 */
export interface ResumeSection {
  title: string;
  icon: SectionIcon;
  items: SectionItem[];
}

export type SectionIcon = 'work' | 'project' | 'edu' | 'skill' | 'summary';

/** 板块内条目 */
export interface SectionItem {
  type: 'header' | 'bullet' | 'text';
  title?: string;    // 公司名/角色/项目名
  subtitle?: string; // 时间段
  content: string;   // 具体内容 (已清理 markdown 标记)
}
