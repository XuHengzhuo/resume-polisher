/**
 * 离线 API 客户端
 * 静态导出模式下，直接调用本地 mock 函数，无需服务器
 * 如需接入真实 LLM，在此文件中将 mock 替换为 fetch() 调用即可
 */
import {
  mockGrammarCheck,
  mockVerbEnhance,
  mockQuantifyTemplates,
  mockStarExpand,
  mockExtractKeywords,
  mockMatchScore,
  mockDetectChain,
  mockHomogeneityCheck,
  mockInterviewQuestions,
} from '@/lib/mock-ai';
import type {
  GrammarChange,
  VerbChange,
  QuantifyTemplate,
  StarResult,
  StarScenario,
  AtsKeyword,
  ChainIssue,
  HomogeneityResult,
  OpsDirection,
} from '@/types';
import type { InterviewQuestion } from '@/lib/mock-ai';

// ============================================================
// 统一 API 响应格式
// ============================================================
interface ApiResult<T> {
  success: boolean;
  data: T;
  error?: string;
}

// 模拟网络延迟
const delay = (ms = 200) => new Promise(r => setTimeout(r, ms));

// ============================================================
// Polish API
// ============================================================

export async function polishGrammar(text: string): Promise<ApiResult<{ changes: GrammarChange[]; fixed_text: string }>> {
  await delay();
  try {
    const changes = mockGrammarCheck(text);
    return { success: true, data: { changes, fixed_text: text } };
  } catch (e) {
    return { success: false, error: String(e), data: { changes: [], fixed_text: text } };
  }
}

export async function polishVerbs(text: string, direction: OpsDirection): Promise<ApiResult<{ changes: VerbChange[] }>> {
  await delay();
  try {
    const changes = mockVerbEnhance(text, direction);
    return { success: true, data: { changes } };
  } catch (e) {
    return { success: false, error: String(e), data: { changes: [] } };
  }
}

export async function polishQuantify(text: string): Promise<ApiResult<{ templates: QuantifyTemplate[] }>> {
  await delay();
  try {
    const templates = mockQuantifyTemplates(text);
    return { success: true, data: { templates } };
  } catch (e) {
    return { success: false, error: String(e), data: { templates: [] } };
  }
}

export async function polishStar(text: string, scenario: StarScenario): Promise<ApiResult<StarResult>> {
  await delay();
  try {
    const result = mockStarExpand(text, scenario);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: String(e), data: {} as StarResult };
  }
}

// ============================================================
// ATS API
// ============================================================

export async function atsKeywords(jdText: string): Promise<ApiResult<{
  keywords: AtsKeyword[];
  suggestions: string[];
  summary: string;
}>> {
  await delay();
  try {
    const keywords = mockExtractKeywords(jdText);
    const missingCount = keywords.filter(k => !k.found).length;
    return {
      success: true,
      data: {
        keywords,
        suggestions: keywords.filter(k => !k.found).map(k => `建议在简历中增加"${k.keyword}"相关经验描述`),
        summary: `共识别 ${keywords.length} 个关键词，简历中缺少 ${missingCount} 个`,
      },
    };
  } catch (e) {
    return { success: false, error: String(e), data: { keywords: [], suggestions: [], summary: '' } };
  }
}

export async function atsMatch(resumeText: string, jdText: string): Promise<ApiResult<{
  score: number;
  missingKeywords: AtsKeyword[];
  suggestions: string[];
}>> {
  await delay();
  try {
    const result = mockMatchScore(resumeText, jdText);
    return { success: true, data: result };
  } catch (e) {
    return { success: false, error: String(e), data: { score: 0, missingKeywords: [], suggestions: [] } };
  }
}

// ============================================================
// Detect API
// ============================================================

export async function detectChain(text: string): Promise<ApiResult<{
  issues: ChainIssue[];
  homogeneity: HomogeneityResult;
  summary: string;
}>> {
  await delay();
  try {
    const issues = mockDetectChain(text);
    const homogeneity = mockHomogeneityCheck(text);
    return {
      success: true,
      data: {
        issues,
        homogeneity,
        summary: `检测到 ${issues.length} 处链路过短问题，同质化评分: ${homogeneity.score}/100`,
      },
    };
  } catch (e) {
    return { success: false, error: String(e), data: { issues: [], homogeneity: { score: 0, warnings: [], suggestions: [] }, summary: '' } };
  }
}

// ============================================================
// Interview API
// ============================================================

export async function interviewQuestions(text: string): Promise<ApiResult<{
  questions: InterviewQuestion[];
  categories: { key: string; label: string; count: number }[];
  summary: string;
}>> {
  await delay();
  try {
    const questions = mockInterviewQuestions(text);
    const categories = [
      { key: 'data', label: '📊 数据追问' },
      { key: 'method', label: '🔬 方法论深挖' },
      { key: 'scenario', label: '🎯 情境模拟' },
      { key: 'detail', label: '🔍 项目细节' },
    ];
    return {
      success: true,
      data: {
        questions,
        categories: categories.map(c => ({ ...c, count: questions.filter(q => q.category === c.key).length })),
        summary: `根据简历内容，共生成 ${questions.length} 道面试模拟题`,
      },
    };
  } catch (e) {
    return { success: false, error: String(e), data: { questions: [], categories: [], summary: '' } };
  }
}
