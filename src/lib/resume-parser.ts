import { ParsedResume, ResumeHeader, ResumeSection, SectionItem } from '@/types';

/** 板块关键词匹配 */
const SECTION_KEYWORDS: { pattern: RegExp; title: string; icon: 'work' | 'project' | 'edu' | 'skill' | 'summary' }[] = [
  { pattern: /工作(经历|经验)|职场经历|从业经历/, title: '工作经历', icon: 'work' },
  { pattern: /项目(经历|经验)|主要项目/, title: '项目经验', icon: 'project' },
  { pattern: /教育(背景|经历)|学历|学校/, title: '教育背景', icon: 'edu' },
  { pattern: /(核心)?技能|技术栈|能力|专业能力|熟练掌握/, title: '核心技能', icon: 'skill' },
  { pattern: /自我(介绍|评价|描述)|个人(简介|介绍|总结)|关于我/, title: '自我评价', icon: 'summary' },
];

/** 联系信息正则 */
const PHONE_RE = /1[3-9]\d{9}/;
const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const LOCATION_RE = /(北京|上海|广州|深圳|杭州|成都|武汉|南京|西安|重庆|苏州|天津|长沙|郑州|东莞|青岛|厦门|合肥|福州|无锡|宁波|佛山|大连|济南|沈阳|昆明|长春|哈尔滨|石家庄)/;

/** 时间段模式 */
const DATE_RANGE_RE = /\d{4}[.年]\d{1,2}?\s*[-–—至到]\s*(\d{4}[.年]\d{1,2}?|至今|现在)/;

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

  // 在前 8 行中搜索联系信息
  const searchRange = lines.slice(0, Math.min(8, lines.length));
  const fullText = searchRange.join(' ');

  // 姓名：第一个不含特殊字符且较短的文本行
  for (const line of searchRange) {
    const clean = line.replace(/[#*\-\s]/g, '');
    if (clean.length >= 2 && clean.length <= 10 && !PHONE_RE.test(line) && !EMAIL_RE.test(line)) {
      header.name = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim();
      break;
    }
  }

  // 手机号
  const phoneMatch = fullText.match(PHONE_RE);
  if (phoneMatch) header.phone = phoneMatch[0];

  // 邮箱
  const emailMatch = fullText.match(EMAIL_RE);
  if (emailMatch) header.email = emailMatch[0];

  // 城市
  const locationMatch = fullText.match(LOCATION_RE);
  if (locationMatch) header.location = locationMatch[0];

  return header;
}

/** 找到各板块的起止行 */
function findSectionBoundaries(lines: string[]): { startIdx: number; title: string; icon: 'work' | 'project' | 'edu' | 'skill' | 'summary' }[] {
  const boundaries: { startIdx: number; title: string; icon: 'work' | 'project' | 'edu' | 'skill' | 'summary' }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Markdown 标题 (## xxx 或 ### xxx)
    if (/^#{2,3}\s+/.test(line)) {
      const title = line.replace(/^#+\s*/, '');
      const icon = guessIcon(title);
      boundaries.push({ startIdx: i, title, icon });
      continue;
    }

    // 关键词匹配
    for (const kw of SECTION_KEYWORDS) {
      if (kw.pattern.test(line) && line.length < 30 && !line.startsWith('-') && !line.startsWith('•')) {
        // 检查是否已被 markdown 标题覆盖
        const alreadyCovered = boundaries.some(b => b.startIdx === i);
        if (!alreadyCovered) {
          boundaries.push({ startIdx: i, title: kw.title, icon: kw.icon });
        }
        break;
      }
    }
  }

  return boundaries;
}

/** 根据标题文本猜测板块类型 */
function guessIcon(title: string): 'work' | 'project' | 'edu' | 'skill' | 'summary' {
  for (const kw of SECTION_KEYWORDS) {
    if (kw.pattern.test(title)) return kw.icon;
  }
  return 'work';
}

/** 构建板块数据 */
function buildSections(
  lines: string[],
  boundaries: { startIdx: number; title: string; icon: 'work' | 'project' | 'edu' | 'skill' | 'summary' }[]
): ResumeSection[] {
  const sections: ResumeSection[] = [];

  for (let i = 0; i < boundaries.length; i++) {
    const b = boundaries[i];
    const nextStart = i + 1 < boundaries.length ? boundaries[i + 1].startIdx : lines.length;

    // 从标题下一行到下一个标题前一行
    const sectionLines = lines.slice(b.startIdx + 1, nextStart);

    // 跳过板块标题行本身中的非内容部分
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

    // 子弹列表项
    if (/^[-•]\s+/.test(line)) {
      const content = cleanLine(line.replace(/^[-•]\s+/, ''));
      items.push({ type: 'bullet', content });
      i++;
      continue;
    }

    // 对于工作/项目板块，尝试识别"公司名/角色 + 时间"模式
    if ((icon === 'work' || icon === 'project') && i < lines.length) {
      // 检查是否是一个 header-like 行（短，可能含时间段）
      const hasDate = DATE_RANGE_RE.test(line);
      const isShort = line.length < 60;
      const nextLine = i + 1 < lines.length ? lines[i + 1] : '';

      if (hasDate || (isShort && !line.startsWith('-') && !line.startsWith('•'))) {
        // 这一行可能是公司/角色名，看看要不要和下一行配对
        const nextHasDate = DATE_RANGE_RE.test(nextLine);
        const nextIsShort = nextLine.length < 60 && !nextLine.startsWith('-') && !nextLine.startsWith('•');

        if (hasDate) {
          // 当前行含日期：公司名+日期在同一行
          const { title, subtitle } = splitTitleDate(line);
          items.push({ type: 'header', title, subtitle, content: '' });
          i++;
          // 如果下一行也是短行且无日期，可能是角色
          if (nextIsShort && !nextHasDate && nextLine.trim()) {
            items.push({ type: 'header', title: cleanLine(nextLine), content: '' });
            i++;
          }
          continue;
        } else if (nextHasDate) {
          // 当前行是标题，下一行是日期
          items.push({
            type: 'header',
            title: cleanLine(line),
            subtitle: cleanLine(nextLine.replace(DATE_RANGE_RE, match => match)),
            content: '',
          });
          i += 2;
          continue;
        }
      }
    }

    // 普通文本行
    items.push({ type: 'text', content: cleanLine(line) });
    i++;
  }

  return items;
}

/** 分离标题和日期（如 "某某公司  2020-2023"） */
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
