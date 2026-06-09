import { GrammarChange, VerbChange, QuantifyTemplate, StarResult, AtsKeyword, ChainIssue, HomogeneityResult, OpsDirection, StarScenario } from '@/types';

// ============================================================
// Mock AI 响应 - 实际部署时替换为真实 LLM 调用
// ============================================================

/** 语法纠错 */
export function mockGrammarCheck(text: string): GrammarChange[] {
  const changes: GrammarChange[] = [];
  let id = 0;

  if (text.includes('负责公司公众号运营')) {
    changes.push({
      id: `g${++id}`,
      original: '负责公司公众号运营，每周发布3篇文章',
      fixed: '负责公司公众号内容运营，每周稳定产出3篇原创文章',
      explanation: '补充"内容"运营方向，增加"稳定产出"和"原创"修饰',
      applied: false,
    });
  }

  if (text.includes('效果很好')) {
    changes.push({
      id: `g${++id}`,
      original: '效果很好',
      fixed: '活动效果显著',
      explanation: '"效果很好"过于口语化，建议替换为更专业的表述',
      applied: false,
    });
  }

  if (text.includes('涨了不少')) {
    changes.push({
      id: `g${++id}`,
      original: '用户涨了不少',
      fixed: '用户规模实现显著增长',
      explanation: '口语化表达，建议使用专业术语',
      applied: false,
    });
  }

  if (text.includes('做了') && text.includes('维护')) {
    changes.push({
      id: `g${++id}`,
      original: '做了社群日常维护',
      fixed: '执行社群日常维护工作',
      explanation: '"做了"为弱动词，建议替换',
      applied: false,
    });
  }

  return changes;
}

/** 动词强化 */
export function mockVerbEnhance(text: string, direction: OpsDirection): VerbChange[] {
  const changes: VerbChange[] = [];
  let id = 0;

  const verbMap: Record<string, string> = {
    '负责': '主导负责',
    '做了': '制定SOP并执行',
    '参与': '深度参与',
    '策划': '主导策划',
    '提升': '显著提升',
    '做': '落地执行',
    '管理': '统筹管理',
    '维护': '建立机制优化',
    '写': '撰写并优化',
    '发': '制定发布策略',
  };

  for (const [weak, strong] of Object.entries(verbMap)) {
    if (text.includes(weak)) {
      changes.push({
        id: `v${++id}`,
        original: weak,
        enhanced: strong,
        reason: `在${getDirectionLabel(direction)}领域，"${weak}"属于弱动词，建议替换为"${strong}"`,
        applied: false,
      });
    }
  }

  return changes;
}

/** 量化模板生成 */
export function mockQuantifyTemplates(text: string): QuantifyTemplate[] {
  const templates: QuantifyTemplate[] = [];
  let id = 0;

  if (text.includes('提升') || text.includes('增长') || text.includes('涨')) {
    templates.push({
      id: `q${++id}`,
      template: '在[时间段]内，[指标名称]从[基准值]提升至[目标值]，增长[增长率]%',
      description: '绝对数值型',
      category: 'absolute',
    });
    templates.push({
      id: `q${++id}`,
      template: '[指标名称]实现[增长率]%的环比增长，超过行业平均[行业均值]%',
      description: '增长率型',
      category: 'growth',
    });
  }

  if (text.includes('转化') || text.includes('留存') || text.includes('活跃')) {
    templates.push({
      id: `q${++id}`,
      template: '通过[策略/动作]，[转化/留存/活跃]率提升[数值]%，人均[指标]提升至[数值]',
      description: '效率型',
      category: 'efficiency',
    });
  }

  if (text.includes('活动') || text.includes('策划')) {
    templates.push({
      id: `q${++id}`,
      template: '活动总参与人数[数值]，转化率[数值]%，ROI达到[数值]',
      description: '活动效果型',
      category: 'absolute',
    });
  }

  return templates;
}

/** STAR 扩展 */
export function mockStarExpand(text: string, scenario: StarScenario): StarResult {
  const scenarioMap: Record<StarScenario, StarResult> = {
    acquisition: {
      situation: '公司[产品/业务]处于[阶段]，面临用户增长瓶颈，原有渠道获客成本[数值]元/人',
      task: '负责制定拉新策略，目标在[时间段]内实现新增用户[数值]，并将CAC控制在[预算]以内',
      action: '通过[渠道A]投放+[渠道B]裂变组合策略，设计[具体机制]激励老带新，同步优化[落地页/注册流程]转化漏斗',
      result: '[时间段]内新增用户[数值]，超额完成目标[数值]%，CAC降至[数值]元/人，较之前降低[数值]%',
      fullText: '',
    },
    activation: {
      situation: '产品注册用户[数值]，但首日活跃率仅[数值]%，大量用户处于沉默状态',
      task: '设计新用户激活体系，目标将首日活跃率从[数值]%提升至[数值]%',
      action: '搭建[新用户引导流程]，设计[激励机制]（如[具体奖励]），通过[A/B测试]持续优化[关键转化节点]',
      result: '首日活跃率提升至[数值]%，次日留存提升[数值]个百分点，月均激活用户[数值]人',
      fullText: '',
    },
    conversion: {
      situation: '产品免费用户[数值]，但付费转化率仅[数值]%，低于行业平均[数值]%',
      task: '负责提升用户付费转化率，目标在[时间段]内将转化率提升至[数值]%',
      action: '设计[分层定价策略]，针对[用户分层]推出差异化[权益/优惠]，搭建[付费引导流程]并持续优化付费页面',
      result: '付费转化率从[数值]%提升至[数值]%，ARPU增长[数值]%，季度付费收入增加[数值]万元',
      fullText: '',
    },
    retention: {
      situation: '用户次日留存[数值]%，第7日留存仅[数值]%，用户流失严重',
      task: '负责提升用户留存，目标将7日留存率从[数值]%提升至[数值]%',
      action: '建立[用户生命周期管理体系]，设计[分层触达策略]（[推送/短信/邮件]），搭建[流失预警模型]并执行[召回机制]',
      result: '7日留存率提升至[数值]%，30日留存提升[数值]个百分点，成功召回流失用户[数值]人，挽回潜在损失[数值]万元',
      fullText: '',
    },
  };

  const result = scenarioMap[scenario];
  result.fullText = `**S (Situation - 背景):**\n${result.situation}\n\n**T (Task - 任务):**\n${result.task}\n\n**A (Action - 行动):**\n${result.action}\n\n**R (Result - 结果):**\n${result.result}`;
  return result;
}

/** ATS 关键词提取 */
export function mockExtractKeywords(jdText: string): AtsKeyword[] {
  const allKeywords: AtsKeyword[] = [
    { keyword: 'AARRR', category: 'model', found: false },
    { keyword: 'RFM', category: 'model', found: false },
    { keyword: '转化漏斗', category: 'model', found: false },
    { keyword: 'LTV', category: 'metric', found: false },
    { keyword: 'CAC', category: 'metric', found: false },
    { keyword: 'ROI', category: 'metric', found: false },
    { keyword: 'DAU/MAU', category: 'metric', found: false },
    { keyword: '留存率', category: 'metric', found: false },
    { keyword: '用户分层', category: 'skill', found: false },
    { keyword: '数据分析', category: 'skill', found: false },
    { keyword: 'A/B测试', category: 'skill', found: false },
    { keyword: '用户画像', category: 'skill', found: false },
    { keyword: '私域运营', category: 'skill', found: false },
    { keyword: '社群SOP', category: 'skill', found: false },
    { keyword: '裂变增长', category: 'skill', found: false },
  ];

  // 从 JD 中匹配已有关键词
  const jdLower = jdText.toLowerCase();
  return allKeywords.map(k => ({
    ...k,
    found: jdLower.includes(k.keyword.toLowerCase()),
  }));
}

/** 计算简历与JD匹配度 */
export function mockMatchScore(resumeText: string, jdText: string): {
  score: number;
  missingKeywords: AtsKeyword[];
  suggestions: string[];
} {
  const allKeywords = mockExtractKeywords(jdText);
  const missingKeywords = allKeywords.filter(k => !k.found);

  // 简单模拟：基于JD长度和关键词覆盖
  const foundCount = allKeywords.filter(k => k.found).length;
  const score = Math.min(100, Math.round((foundCount / allKeywords.length) * 70 + 30));

  return {
    score,
    missingKeywords,
    suggestions: missingKeywords.map(k =>
      `建议在简历中增加"${k.keyword}"相关经验描述`
    ),
  };
}

/** 链路过短检测 */
export function mockDetectChain(text: string): ChainIssue[] {
  const issues: ChainIssue[] = [];
  let id = 0;

  // 检测"只有动作无结果"的句子
  const patterns = [
    { regex: /负责.*[。，.]/g, msg: '缺少产出指标' },
    { regex: /策划.*[。，.]/g, msg: '缺少活动效果数据' },
    { regex: /提升.*[。，.]/g, msg: '缺少具体提升幅度' },
    { regex: /优化.*[。，.]/g, msg: '缺少优化前后对比数据' },
  ];

  for (const { regex, msg } of patterns) {
    const matches = text.match(regex);
    if (matches) {
      for (const sentence of matches) {
        // 检查句子中是否包含数字
        if (!/\d/.test(sentence)) {
          issues.push({
            id: `c${++id}`,
            sentence: sentence.replace(/[。，.]/g, ''),
            reason: msg,
            suggestion: `建议补充"${sentence.replace(/[。，.]/g, '')}"的具体数据指标`,
          });
        }
      }
    }
  }

  return issues;
}

/** 同质化检测 */
export function mockHomogeneityCheck(text: string): HomogeneityResult {
  const genericPhrases = [
    '负责日常运营',
    '提升用户活跃度',
    '策划线上活动',
    '数据分析',
    '社群维护',
    '公众号运营',
    '用户增长',
  ];

  const found = genericPhrases.filter(p => text.includes(p));
  const score = Math.min(100, found.length * 15 + 20);

  return {
    score,
    warnings: found.map(p => `"${p}" 是运营简历高频词汇，建议用具体数据差异化`),
    suggestions: [
      '添加"首创"、"从0到1"、"低于平均成本X%"等独特成就',
      '用具体项目名称替代通用描述',
      '补充个人在团队中的独特贡献角色',
    ],
  };
}

/** 面试模拟题 */
export interface InterviewQuestion {
  id: string;
  category: 'data' | 'method' | 'scenario' | 'detail';
  question: string;
  hint: string;
  expectedPoints: string[];
}

export function mockInterviewQuestions(text: string): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];
  let id = 0;

  // 数据追问类
  if (text.includes('提升') || text.includes('增长') || text.includes('涨')) {
    questions.push({
      id: `iq${++id}`,
      category: 'data',
      question: '你提到的增长/提升数据，具体是通过什么方法测量和归因的？如何排除自然增长的影响？',
      hint: '面试官在验证你数据的真实性，准备具体的归因方法论',
      expectedPoints: ['A/B测试对照组', '同比/环比基线对比', '归因模型（首次触达/末次触达/线性）', '外部因素排除（季节性/市场活动等）'],
    });
    questions.push({
      id: `iq${++id}`,
      category: 'data',
      question: '这段经历中，你设定的核心指标是什么？为什么选择这个指标而不是其他？',
      hint: '考察你对"北极星指标"的理解和指标拆解能力',
      expectedPoints: ['北极星指标 vs 虚荣指标的区别', '指标拆解逻辑（如AARRR各环节对应指标）', '指标选择的业务背景', '如何平衡短期和长期指标'],
    });
  }

  // 方法论深挖类
  if (text.includes('运营') || text.includes('策划') || text.includes('活动')) {
    questions.push({
      id: `iq${++id}`,
      category: 'method',
      question: '请详细描述一次你从0到1策划并执行项目的完整流程，以及过程中遇到的最大挑战是什么？',
      hint: '面试官想了解你的项目管理和问题解决能力',
      expectedPoints: ['需求分析与目标设定', '资源评估与协调', '里程碑规划与执行', '风险预案', '上线后复盘与迭代'],
    });
    questions.push({
      id: `iq${++id}`,
      category: 'method',
      question: '在你的运营方法论中，你最常使用哪个分析框架（如AARRR/RFM/漏斗分析）？能否用实际案例说明？',
      hint: '考察运营理论功底和实际应用能力',
      expectedPoints: ['选择具体框架并说明理由', '结合业务场景的实际应用案例', '框架的局限性认知', '如何根据业务阶段调整框架'],
    });
  }

  // 情境模拟类
  questions.push({
    id: `iq${++id}`,
    category: 'scenario',
    question: '假设上级要求你在1个月内将某个指标提升50%，但预算只有平时的30%，你会怎么做？',
    hint: '考察资源受限下的创造力、优先级判断和预期管理能力',
    expectedPoints: ['向上沟通：确认目标是否合理，能否重新定义指标', '资源盘点：挖掘免费/低成本渠道', '优先级排序：聚焦高杠杆动作', '快速实验：设计最小可行性方案验证', '风险预案：准备Plan B'],
  });

  if (text.includes('社群') || text.includes('用户')) {
    questions.push({
      id: `iq${++id}`,
      category: 'scenario',
      question: '如果社群中出现大规模用户投诉/负面舆情，你作为运营负责人会怎么处理？',
      hint: '考察危机公关能力和用户同理心',
      expectedPoints: ['第一时间响应机制', '问题分级与升级通道', '用户情绪安抚话术', '根本原因分析与复盘', '建立预防机制'],
    });
  }

  questions.push({
    id: `iq${++id}`,
    category: 'detail',
    question: '你简历中提到的工作，哪些是你独立完成的，哪些是协作完成的？在协作中你扮演什么角色？',
    hint: '面试官在区分你的个人贡献 vs 团队成果',
    expectedPoints: ['清晰区分个人贡献和团队成果', '描述跨部门协作经验', '说明在团队中的具体角色（主导/支持/协调）', '展示团队合作意识和沟通能力'],
  });

  // 数据运营专项
  if (text.includes('数据') || /\d/.test(text)) {
    questions.push({
      id: `iq${++id}`,
      category: 'data',
      question: '你日常是如何用数据驱动运营决策的？能举一个具体的数据分析案例吗？',
      hint: '准备一个完整的数据分析案例：发现问题→分析原因→提出方案→验证效果',
      expectedPoints: ['数据采集工具（SQL/BI工具）使用经验', '分析的完整链路', '从数据洞察到策略落地', '效果验证与迭代'],
    });
  }

  // 内容运营专项
  if (text.includes('公众号') || text.includes('内容') || text.includes('文章')) {
    questions.push({
      id: `iq${++id}`,
      category: 'detail',
      question: '你如何判断一篇文章的"好"与"坏"？除了阅读量，你还关注哪些指标？',
      hint: '考察内容运营的指标体系认知深度',
      expectedPoints: ['传播指标：阅读/分享/收藏', '转化指标：关注转化率/留资率', '互动指标：评论质量/用户反馈', '品牌指标：搜索量/品牌提及', '内容ROI的核算方式'],
    });
  }

  return questions;
}

function getDirectionLabel(d: OpsDirection): string {
  const map: Record<OpsDirection, string> = {
    user_ops: '用户运营',
    activity_ops: '活动运营',
    content_ops: '内容运营',
    community_ops: '社群运营',
    social_ops: '新媒体运营',
    data_ops: '数据运营',
  };
  return map[d];
}
