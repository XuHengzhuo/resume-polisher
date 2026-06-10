import { ParsedResume, ResumeHeader, ResumeSection, SectionItem } from '@/types';

/** 板块关键词匹配 */
const SECTION_KEYWORDS: { pattern: RegExp; title: string; icon: 'work' | 'project' | 'edu' | 'skill' | 'summary' }[] = [
  { pattern: /工作[\/\s]*(实习)?[\/\s]*(经历|经验)|职场经历|从业经历|工作经验/, title: '工作经历', icon: 'work' },
  { pattern: /项目[\/\s]*(经历|经验)|主要项目|项目运营/, title: '项目经验', icon: 'project' },
  { pattern: /教育[\/\s]*(背景|经历)|学历|学校/, title: '教育背景', icon: 'edu' },
  { pattern: /(核心|专业)?技能|技术栈|专业能力|熟练掌握/, title: '核心技能', icon: 'skill' },
  { pattern: /自我[\/\s]*(介绍|评价|描述)|个人[\/\s]*(简介|介绍|总结)|关于我/, title: '自我评价', icon: 'summary' },
  { pattern: /求职[\/\s]*(意向|方向|目标)|应聘岗位/, title: '求职意向', icon: 'summary' },
  { pattern: /联系[\/\s]*(方式)?$/, title: '', icon: 'work' }, // 联系方式标记，不产生板块
];

/** 联系信息正则 */
const PHONE_DASHED_RE = /1[3-9]\d[-\s]?\d{4}[-\s]?\d{4}/;
const PHONE_CLEAN_RE = /1[3-9]\d{9}/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const LOCATION_RE = /(北京|上海|广州|深圳|杭州|成都|武汉|南京|西安|重庆|苏州|天津|长沙|郑州|东莞|青岛|厦门|合肥|福州|无锡|宁波|佛山|大连|济南|沈阳|昆明|长春|哈尔滨|石家庄)/;

/** 时间段模式 — 支持 2023.07 – 至今 / 2019.09 – 2023.06 等格式 */
const DATE_RANGE_RE = /\d{4}[.年/]\d{1,2}\s*[-–—至到]\s*(\d{4}[.年/]\d{1,2}|至今|现在)/;

/** 含 | 的条目行（如 "上海云创科技有限公司 | 运营助理 | 2023.07 – 至今"） */
const PIPE_HEADER_RE = /^[^|]+\|[^|]+\|[^|]+/;

/**
 * 解析简历文本为结构化数据
 */
export function parseResume(text: string): ParsedResume {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // 1. 提取个人信息
  const header = extractHeader(lines);

  // 2. 按板块拆分
  const sectionBoundaries = findSectionBoundaries(lines);
  const sections = buildSections(lines, sectionBoundaries);

  // 3. 如果没有识别到任何板块，把所有内容放到一个默认板块
  if (sections.length === 0) {
    sections.push({
      title: '工作经历',
      icon: 'work',
      items: lines.map(l => toSectionItem(l)),
    });
  }

  return { header, sections };
}

/** 提取个人信息 */
function extractHeader(lines: string[]): ResumeHeader {
  const header: ResumeHeader = { name: '' };

  // 在前 10 行中搜索联系信息
  const searchRange = lines.slice(0, Math.min(10, lines.length));
  const fullText = searchRange.join(' ');

  // 姓名：前几行中不含特殊字符的短行，取第一个看起来像人名的行
  for (const line of searchRange) {
    const clean = line.replace(/[*#\s]/g, '');
    // 剔除联系信息行
    if (isContactLine(line)) continue;
    if (clean.length >= 2 && clean.length <= 12) {
      // 清理 "张三 – 运营专员简历" → "张三"
      const nameOnly = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      const dashIdx = nameOnly.search(/\s*[-–—]\s*/);
      header.name = dashIdx > 0 ? nameOnly.slice(0, dashIdx).trim() : nameOnly;
      break;
    }
  }

  // 手机号 — 先尝试带横线的格式
  const phoneDashed = fullText.match(PHONE_DASHED_RE);
  if (phoneDashed) {
    header.phone = phoneDashed[0].replace(/[-\s]/g, '');
  } else {
    const phoneClean = fullText.match(PHONE_CLEAN_RE);
    if (phoneClean) header.phone = phoneClean[0];
  }

  // 邮箱
  const emailMatch = fullText.match(EMAIL_RE);
  if (emailMatch) header.email = emailMatch[0];

  // 城市
  const locationMatch = fullText.match(LOCATION_RE);
  if (locationMatch) header.location = locationMatch[0];

  return header;
}

/** 判断是否为联系信息行 */
function isContactLine(line: string): boolean {
  return /^(电话|手机|邮箱|Email|现居|所在地|微信|QQ|地址)/i.test(line) ||
    PHONE_DASHED_RE.test(line) ||
    EMAIL_RE.test(line);
}

/** 找到各板块的起止行 */
function findSectionBoundaries(lines: string[]): { startIdx: number; title: string; icon: 'work' | 'project' | 'edu' | 'skill' | 'summary' }[] {
  const boundaries: { startIdx: number; title: string; icon: 'work' | 'project' | 'edu' | 'skill' | 'summary' }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Markdown 标题 (## xxx 或 ### xxx)
    if (/^#{2,3}\s+/.test(line)) {
      const title = line.replace(/^#+\s*/, '');
      const matched = guessSection(title);
      if (matched) {
        boundaries.push({ startIdx: i, title: matched.title, icon: matched.icon });
      }
      continue;
    }

    // 关键词匹配 — 作为板块标题的行通常较短且不含过多标点
    if (line.length < 40 && !line.startsWith('-') && !line.startsWith('•') && !isContactLine(line)) {
      const matched = guessSection(line);
      if (matched && matched.title) {
        // 检查是否已被覆盖
        const alreadyCovered = boundaries.some(b => b.startIdx === i);
        if (!alreadyCovered) {
          boundaries.push({ startIdx: i, title: matched.title, icon: matched.icon });
        }
      }
    }
  }

  return boundaries;
}

/** 根据标题文本匹配板块 */
function guessSection(title: string): { title: string; icon: 'work' | 'project' | 'edu' | 'skill' | 'summary' } | null {
  for (const kw of SECTION_KEYWORDS) {
    if (kw.pattern.test(title)) {
      // 联系方式不产生板块
      if (kw.title === '') return null;
      return { title: kw.title, icon: kw.icon };
    }
  }
  return null;
}

/** 构建板块数据 */
function buildSections(
  lines: string[],
  boundaries: { startIdx: number; title: string; icon: 'work' | 'project' | 'edu' | 'skill' | 'summary' }[]
): ResumeSection[] {
  // 去重：按 startIdx 排序
  boundaries.sort((a, b) => a.startIdx - b.startIdx);
  const seen = new Set<number>();
  const unique = boundaries.filter(b => {
    if (seen.has(b.startIdx) || seen.has(b.startIdx + 1) || seen.has(b.startIdx - 1)) return false;
    seen.add(b.startIdx);
    return true;
  });

  const sections: ResumeSection[] = [];

  for (let i = 0; i < unique.length; i++) {
    const b = unique[i];
    const nextStart = i + 1 < unique.length ? unique[i + 1].startIdx : lines.length;

    // 从标题下一行到下一个标题前一行
    const sectionLines = lines.slice(b.startIdx + 1, nextStart);

    // 过滤掉碰巧匹配的非板块标题行（如 "求职意向" 后面的内容开头）
    const items = parseSectionItems(sectionLines, b.icon);

    if (items.length > 0) {
      sections.push({ title: b.title, icon: b.icon, items });
    }
  }

  return sections;
}

/** 将板块内的行解析为条目 */
function parseSectionItems(lines: string[], icon: string): SectionItem[] {
  const items: SectionItem[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 跳过空行
    if (!line.trim()) {
      i++;
      continue;
    }

    // 子弹列表项 (markdown: - 或 •)
    if (/^[-•]\s+/.test(line)) {
      const content = cleanLine(line.replace(/^[-•]\s+/, ''));
      items.push({ type: 'bullet', content });
      i++;
      continue;
    }

    // 对于工作/项目板块，优先识别公司/角色/时间段行
    if (icon === 'work' || icon === 'project') {
      const hasDate = DATE_RANGE_RE.test(line);
      const hasPipe = PIPE_HEADER_RE.test(line) && line.length < 100;

      // 含 | 的行: "上海云创科技有限公司 | 运营助理 | 2023.07 – 至今"
      if (hasPipe) {
        const parts = line.split('|').map(p => p.trim());
        items.push({
          type: 'header',
          title: parts[0],
          subtitle: parts.length >= 3 ? `${parts[1]} · ${parts[2]}` : parts[1] || '',
          content: '',
        });
        i++;
        continue;
      }

      // 含日期段的行: "校园 KOC 孵化计划 | 项目运营（课程作业）| 2022.03 – 2022.08"
      if (hasDate && line.length < 120) {
        const { title, subtitle } = splitTitleDate(line);
        // 清理 title 尾部残留的 | 符号
        const cleanTitle = title.replace(/\s*\|\s*$/, '').trim();
        items.push({ type: 'header', title: cleanTitle, subtitle, content: '' });
        i++;
        continue;
      }

      // 在当前工作板块中，没有日期和管道标记的行 → 长行视为 bullet，短行可能是角色名
      if (line.length > 25 && !hasDate && !hasPipe) {
        items.push({ type: 'bullet', content: cleanLine(line) });
        i++;
        continue;
      }

      // 极短行 → 可能是角色名或公司名
      if (line.length <= 25) {
        items.push({ type: 'header', title: cleanLine(line), content: '' });
        i++;
        continue;
      }
    }

    // 对于 教育 / 技能 / 自我评价 板块
    // 含 | 的行: "上海大学 | 市场营销 | 本科 | 2019.09 – 2023.06"
    if (PIPE_HEADER_RE.test(line) && line.length < 120) {
      const parts = line.split('|').map(p => p.trim());
      const datePart = parts.find(p => DATE_RANGE_RE.test(p));
      const titlePart = parts.filter(p => !DATE_RANGE_RE.test(p)).join(' · ');
      items.push({
        type: 'header',
        title: titlePart,
        subtitle: datePart || '',
        content: '',
      });
      i++;
      continue;
    }

    // 普通文本行
    items.push({ type: 'text', content: cleanLine(line) });
    i++;
  }

  return items;
}

/** 分离标题和日期 */
function splitTitleDate(line: string): { title: string; subtitle?: string } {
  const dateMatch = line.match(DATE_RANGE_RE);
  if (dateMatch && dateMatch.index !== undefined) {
    const title = line.substring(0, dateMatch.index).trim();
    const subtitle = dateMatch[0];
    return { title, subtitle };
  }
  return { title: line };
}

/** 将单行转为条目 */
function toSectionItem(line: string): SectionItem {
  if (/^[-•]\s+/.test(line)) {
    return { type: 'bullet', content: cleanLine(line.replace(/^[-•]\s+/, '')) };
  }
  return { type: 'text', content: cleanLine(line) };
}

/** 清理 markdown 标记 */
function cleanLine(line: string): string {
  return line
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^#+\s*/, '')
    .trim();
}
