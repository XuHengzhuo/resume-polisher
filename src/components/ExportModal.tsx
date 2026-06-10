'use client';

import { useState, useMemo } from 'react';
import { X, FileText, FileDown, Copy, Check, Printer, Globe, Sparkles, RotateCcw, Eye } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { batchSafeReplace, cleanRecursiveDuplication } from '@/lib/dedup';
import { polishGrammar, polishVerbs } from '@/lib/api-client';
import { parseResume } from '@/lib/resume-parser';

type ExportFormat = 'pdf' | 'md' | 'txt' | 'html';

interface FormatOption {
  id: ExportFormat;
  label: string;
  icon: React.ReactNode;
  desc: string;
  ext: string;
}

const FORMATS: FormatOption[] = [
  { id: 'pdf', label: 'PDF 简历', icon: <Printer size={18} />, desc: '打印排版，推荐投递用', ext: '.pdf' },
  { id: 'md', label: 'Markdown', icon: <FileText size={18} />, desc: '标记格式，可导入编辑器', ext: '.md' },
  { id: 'txt', label: '纯文本', icon: <FileDown size={18} />, desc: '无格式纯文本，通用', ext: '.txt' },
  { id: 'html', label: 'HTML 富文本', icon: <Globe size={18} />, desc: '保留样式，适合网页', ext: '.html' },
];

function renderPreview(text: string, format: ExportFormat): string {
  switch (format) {
    case 'md': return text;
    case 'txt': return text;
    case 'html': return renderHTMLPreview(text);
    default: return '';
  }
}

function renderHTMLPreview(text: string): string {
  const lines = text.split('\n');
  return lines.map(line => {
    const formatted = line.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    if (line.startsWith('## ')) return `<h2 style="font-size:16px;color:#2563eb;border-left:3px solid #2563eb;padding-left:8px;margin:12px 0 6px;">${formatted.replace(/^##\s*/, '')}</h2>`;
    if (line.startsWith('- ')) return `<li style="margin:2px 0 2px 16px;">${formatted.replace(/^-\s*/, '')}</li>`;
    return `<p style="margin:4px 0;">${formatted}</p>`;
  }).join('');
}

export function ExportModal() {
  const resumeText = useStore(s => s.resumeText);
  const setResumeText = useStore(s => s.setResumeText);
  const direction = useStore(s => s.direction);
  const addSnapshot = useStore(s => s.addSnapshot);
  const setPolishedText = useStore(s => s.setPolishedText);
  const setLoading = useStore(s => s.setLoading);

  const open = useStore(s => s.exportModalOpen);
  const setOpen = useStore(s => s.setExportModalOpen);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerated, setRegenerated] = useState(false);

  const previewContent = useMemo(
    () => renderPreview(resumeText, format),
    [resumeText, format]
  );

  // 使用解析器获取结构化简历
  const parsed = useMemo(() => parseResume(resumeText), [resumeText]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    addSnapshot('重新润色前自动保存');
    try {
      const [grammarRes, verbsRes] = await Promise.all([
        polishGrammar(resumeText),
        polishVerbs(resumeText, direction),
      ]);
      let polished = resumeText;
      if (grammarRes.success) {
        const gr = batchSafeReplace(polished,
          grammarRes.data.changes.map((c: { original: string; fixed: string }) => ({ original: c.original, replacement: c.fixed }))
        );
        polished = gr.text;
      }
      if (verbsRes.success) {
        const vr = batchSafeReplace(polished,
          verbsRes.data.changes.map((c: { original: string; enhanced: string }) => ({ original: c.original, replacement: c.enhanced }))
        );
        polished = vr.text;
      }
      polished = cleanRecursiveDuplication(polished);
      if (polished !== resumeText) {
        setResumeText(polished);
        setPolishedText(polished);
        setRegenerated(true);
        setTimeout(() => setRegenerated(false), 3000);
      }
    } catch {
      alert('重新润色失败');
    } finally {
      setRegenerating(false);
    }
  };

  const handleExport = () => {
    switch (format) {
      case 'pdf': exportPDF(); break;
      case 'md': downloadFile(resumeText, 'resume-polished.md', 'text/markdown'); break;
      case 'txt': downloadFile(resumeText, 'resume-polished.txt', 'text/plain'); break;
      case 'html': exportHTML(); break;
    }
  };

  const exportPDF = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) { alert('请允许弹窗以导出 PDF'); return; }

    const { header, sections } = parsed;

    // 从简历文本提取技能标签
    const skillTags = extractSkillTags(resumeText);

    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>个人简历</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;
    font-size: 13px; line-height: 1.75; color: #2d3748;
    max-width: 210mm; margin: 0 auto;
  }
  /* ── 顶部横幅 ── */
  .header {
    background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%);
    color: white; padding: 28px 36px 24px;
    position: relative; overflow: hidden; border-radius: 4px 4px 0 0;
  }
  .header::after {
    content: ''; position: absolute; top: -40px; right: -20px;
    width: 140px; height: 140px; border-radius: 50%;
    background: rgba(255,255,255,0.05);
  }
  .header h1 { font-size: 26px; font-weight: 700; letter-spacing: 2px; margin-bottom: 8px; position: relative; z-index: 1; }
  .header .contact { display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; opacity: 0.85; position: relative; z-index: 1; }
  .header .contact span { white-space: nowrap; }
  /* ── 内容区 ── */
  .content { padding: 24px 36px; background: #fff; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 4px 4px; }
  /* 板块 */
  .section { margin-bottom: 22px; }
  .section:last-child { margin-bottom: 0; }
  .section-title {
    font-size: 15px; font-weight: 700; color: #1e3a5f;
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 10px; padding-bottom: 6px;
    border-bottom: 2px solid #e2e8f0;
  }
  .section-title .icon {
    width: 26px; height: 26px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; color: white; flex-shrink: 0;
  }
  .icon-work { background: linear-gradient(135deg, #2563eb, #6366f1); }
  .icon-project { background: linear-gradient(135deg, #7c3aed, #a855f7); }
  .icon-edu { background: linear-gradient(135deg, #ea580c, #f97316); }
  .icon-skill { background: linear-gradient(135deg, #059669, #10b981); }
  .icon-summary { background: linear-gradient(135deg, #0891b2, #06b6d4); }
  /* 条目 */
  .entry { margin-bottom: 10px; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
  .entry-title { font-size: 13px; font-weight: 700; color: #1e3a5f; }
  .entry-subtitle { font-size: 13px; color: #475569; font-weight: 500; }
  .entry-meta { font-size: 11px; color: #94a3b8; white-space: nowrap; margin-left: 12px; }
  .bullet-list { list-style: none; padding: 0; }
  .bullet-list li { position: relative; padding-left: 16px; margin-bottom: 4px; font-size: 12.5px; color: #475569; line-height: 1.65; }
  .bullet-list li::before { content: '•'; position: absolute; left: 2px; color: #2563eb; font-weight: bold; }
  .text-item { font-size: 12.5px; color: #475569; margin-bottom: 4px; line-height: 1.65; }
  /* 数字高亮 */
  .metric { font-weight: 700; color: #2563eb; background: #eff6ff; padding: 1px 5px; border-radius: 3px; white-space: nowrap; }
  /* 技能标签 */
  .tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px; }
  .tag {
    display: inline-block; padding: 4px 14px;
    border-radius: 20px; font-size: 11px; font-weight: 600; color: white;
  }
  .tag:nth-child(1) { background: #2563eb; } .tag:nth-child(2) { background: #7c3aed; }
  .tag:nth-child(3) { background: #059669; } .tag:nth-child(4) { background: #ea580c; }
  .tag:nth-child(5) { background: #0891b2; } .tag:nth-child(6) { background: #d946ef; }
  .tag:nth-child(7) { background: #65a30d; } .tag:nth-child(8) { background: #e11d48; }
  /* 页脚 */
  .footer { text-align: center; padding: 14px 36px 20px; font-size: 10px; color: #94a3b8; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none; }
  }
</style></head>
<body>
  <div class="no-print" style="background:#eff6ff;padding:10px 16px;text-align:center;font-size:13px;color:#2563eb;border-bottom:1px solid #bfdbfe;margin-bottom:4px;">
    💡 按 <strong>Ctrl+P</strong> → 目标打印机选 <strong>"另存为 PDF"</strong> → 边距选"默认" → 保存
  </div>

  <!-- 顶部横幅 -->
  <div class="header">
    <h1>${escapeHTML(header.name || '个人简历')}</h1>
    <div class="contact">
      ${header.phone ? `<span>📱 ${header.phone}</span>` : ''}
      ${header.email ? `<span>📧 ${header.email}</span>` : ''}
      ${header.location ? `<span>📍 ${header.location}</span>` : ''}
    </div>
  </div>

  <div class="content">
    ${sections.map(section => {
      const { iconClass, iconEmoji } = getSectionIcon(section.icon);
      return `
    <div class="section">
      <div class="section-title">
        <div class="icon ${iconClass}">${iconEmoji}</div>
        ${escapeHTML(section.title)}
      </div>
      ${renderSectionItems(section.items)}
    </div>`;
    }).join('')}

    <!-- 技能标签 -->
    ${skillTags.length > 0 ? `
    <div class="section">
      <div class="section-title">
        <div class="icon icon-skill">🛠️</div>
        核心能力
      </div>
      <div class="tag-cloud">
        ${skillTags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}
      </div>
    </div>` : ''}
  </div>

  <div class="footer">
    本简历由「运营简历精修工坊」AI 辅助生成 · 建议根据具体岗位进一步调整
  </div>

  <script>
    setTimeout(() => { document.title = '个人简历'; window.print(); }, 600);
  </script>
</body></html>`;

    function renderSectionItems(items: typeof sections[number]['items']): string {
      const bullets: string[] = [];
      let html = '';

      for (const item of items) {
        if (item.type === 'header') {
          // 先输出之前收集的 bullets
          if (bullets.length > 0) {
            html += `<ul class="bullet-list">${bullets.map(b => `<li>${highlightMetrics(b)}</li>`).join('')}</ul>`;
            bullets.length = 0;
          }
          html += '<div class="entry">';
          html += '<div class="entry-header">';
          if (item.title) {
            html += `<span class="entry-title">${highlightMetrics(escapeHTML(item.title))}</span>`;
          }
          if (item.subtitle) {
            html += `<span class="entry-meta">${highlightMetrics(escapeHTML(item.subtitle))}</span>`;
          }
          html += '</div>';
          if (item.content) {
            html += `<div class="text-item">${highlightMetrics(escapeHTML(item.content))}</div>`;
          }
          html += '</div>';
        } else if (item.type === 'bullet') {
          bullets.push(item.content);
        } else if (item.type === 'text') {
          if (bullets.length > 0) {
            html += `<ul class="bullet-list">${bullets.map(b => `<li>${highlightMetrics(b)}</li>`).join('')}</ul>`;
            bullets.length = 0;
          }
          html += `<div class="text-item">${highlightMetrics(escapeHTML(item.content))}</div>`;
        }
      }
      // 尾部 bullets
      if (bullets.length > 0) {
        html += `<ul class="bullet-list">${bullets.map(b => `<li>${highlightMetrics(b)}</li>`).join('')}</ul>`;
      }
      return html;
    }

    function highlightMetrics(text: string): string {
      return text.replace(/(\d+(?:\.\d+)?%?)/g, '<span class="metric">$1</span>');
    }

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  function escapeHTML(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  const exportHTML = () => {
    const htmlBody = resumeText.split('\n').map(line => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('## ')) return `<h2>${formatted.replace(/^##\s*/, '')}</h2>`;
      if (line.startsWith('- ')) return `<li>${formatted.replace(/^-\s*/, '')}</li>`;
      return `<p>${formatted}</p>`;
    }).join('\n');
    const fullHTML = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>简历</title></head><body style="font-family:PingFang SC,Microsoft YaHei,sans-serif;max-width:700px;margin:0 auto;padding:40px;line-height:1.8;">${htmlBody}</body></html>`;
    downloadFile(fullHTML, 'resume-polished.html', 'text/html');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resumeText);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <FileDown size={14} /> 导出
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 md:p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] md:h-[85vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-5 py-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileDown size={18} className="text-blue-500" />
                <h2 className="text-sm md:text-base font-semibold text-gray-800">导出简历</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {/* Body: 左右分屏 → 移动端上下布局 */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              {/* ── 左侧：格式选择 + 操作 ── */}
              <div className="w-full md:w-[260px] flex-shrink-0 md:border-r border-b md:border-b-0 border-gray-200 flex flex-col bg-gray-50">
                <div className="flex-1 p-3 md:p-4 space-y-2 overflow-y-auto">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">选择格式</label>
                  <div className="grid grid-cols-4 md:grid-cols-1 gap-1.5 md:space-y-1.5">
                    {FORMATS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setFormat(f.id)}
                        className={`flex flex-col md:flex-row items-center gap-1 md:gap-2.5 p-2 md:p-2.5 rounded-xl border-2 text-left transition-all ${
                          format === f.id
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`flex-shrink-0 ${format === f.id ? 'text-blue-600' : 'text-gray-400'}`}>{f.icon}</div>
                        <div className="flex-1 min-w-0 text-center md:text-left">
                          <div className="font-semibold text-xs md:text-sm text-gray-800">{f.label}</div>
                          <div className="hidden md:block text-xs text-gray-400 truncate">{f.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 my-2" />

                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="w-full flex items-center justify-center gap-2 py-2 text-xs md:text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors disabled:opacity-60"
                  >
                    {regenerating ? (
                      <><Sparkles size={14} className="animate-pulse" /> 润色中...</>
                    ) : regenerated ? (
                      <><Check size={14} className="text-green-600" /> 已重新润色 ✓</>
                    ) : (
                      <><RotateCcw size={14} /> 重新润色</>
                    )}
                  </button>
                  {regenerated && (
                    <p className="text-xs text-green-600 text-center">语法纠错 + 动词强化已应用</p>
                  )}
                </div>

                {/* 底部操作栏 */}
                <div className="p-3 md:p-4 border-t border-gray-200 bg-white space-y-2">
                  <div className="flex gap-2 text-xs text-gray-400">
                    <span>字符: {resumeText.replace(/\s/g, '').length}</span>
                    <span>行数: {resumeText.split('\n').filter(l => l.trim()).length}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOpen(false)}
                      className="flex-1 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleExport}
                      className="flex-1 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <FileDown size={14} />
                      导出{FORMATS.find(f => f.id === format)?.ext}
                    </button>
                  </div>
                </div>
              </div>

              {/* ── 右侧：实时预览 ── */}
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                <div className="flex items-center justify-between px-3 md:px-4 py-2 border-b border-gray-100 bg-white flex-shrink-0">
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
                    <Eye size={14} />
                    实时预览 — {FORMATS.find(f => f.id === format)?.label}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="text-xs text-gray-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                  >
                    {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-4">
                  {format === 'pdf' ? (
                    <PDFPreview parsed={parsed} resumeText={resumeText} />
                  ) : format === 'html' ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 text-sm leading-relaxed" style={{ fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif' }}>
                      <div className="mb-2 px-2 py-1 bg-gray-50 rounded text-xs text-gray-400 font-mono">HTML 渲染效果</div>
                      <div dangerouslySetInnerHTML={{ __html: renderHTMLPreview(resumeText) }} />
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                      <div className="px-3 py-1.5 bg-gray-100 border-b border-gray-200 text-xs text-gray-400 font-mono flex items-center justify-between">
                        <span>{format === 'md' ? 'Markdown' : '纯文本'} 预览</span>
                        <span className="text-gray-300">{resumeText.length} 字符</span>
                      </div>
                      <pre className="p-4 text-sm text-gray-700 font-mono whitespace-pre-wrap break-words leading-relaxed">{previewContent}</pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** PDF 预览组件 — 使用解析后的结构化数据 */
function PDFPreview({ parsed, resumeText }: { parsed: ReturnType<typeof parseResume>; resumeText: string }) {
  const { header, sections } = parsed;
  const skillTags = extractSkillTags(resumeText);

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-[210mm] mx-auto border border-gray-200" style={{ fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif' }}>
      {/* 顶部横幅 */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-600 to-purple-600 text-white px-5 py-4 md:px-6 md:py-5">
        <h1 className="text-base md:text-lg font-bold tracking-wide">{header.name || '个人简历'}</h1>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs opacity-85">
          {header.phone && <span>📱 {header.phone}</span>}
          {header.email && <span>📧 {header.email}</span>}
          {header.location && <span>📍 {header.location}</span>}
        </div>
      </div>

      <div className="p-4 md:p-5 space-y-4">
        {sections.map((section, si) => {
          const { iconClass, iconEmoji } = getSectionIcon(section.icon);
          return (
            <div key={si}>
              {/* 板块标题 */}
              <div className="flex items-center gap-2 mb-2 pb-1.5 border-b-2 border-gray-100">
                <div className={`w-5 h-5 md:w-6 md:h-6 rounded flex items-center justify-center text-white text-xs ${iconClass}`}>
                  {iconEmoji}
                </div>
                <span className="text-sm font-bold text-gray-800">{section.title}</span>
              </div>

              {/* 板块内容 */}
              <div className="space-y-2">
                {section.items.map((item, ii) => {
                  if (item.type === 'header') {
                    return (
                      <div key={ii} className="bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex justify-between items-baseline flex-wrap gap-x-3">
                          <span className="text-sm font-semibold text-gray-800">{highlightText(item.title || '')}</span>
                          {item.subtitle && (
                            <span className="text-xs text-gray-400">{item.subtitle}</span>
                          )}
                        </div>
                        {item.content && (
                          <p className="text-xs text-gray-600 mt-0.5">{highlightText(item.content)}</p>
                        )}
                      </div>
                    );
                  }
                  if (item.type === 'bullet') {
                    return (
                      <div key={ii} className="ml-2 pl-3 border-l-2 border-blue-300 text-sm text-gray-700 py-0.5"
                        dangerouslySetInnerHTML={{ __html: '• ' + highlightText(item.content) }} />
                    );
                  }
                  // text type
                  return (
                    <p key={ii} className="text-sm text-gray-700 ml-2"
                      dangerouslySetInnerHTML={{ __html: highlightText(item.content) }} />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 技能标签 */}
        {skillTags.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b-2 border-gray-100">
              <div className="w-5 h-5 md:w-6 md:h-6 rounded bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs">🛠️</div>
              <span className="text-sm font-bold text-gray-800">核心能力</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skillTags.map((tag, i) => {
                const colors = ['bg-blue-500','bg-purple-500','bg-green-500','bg-orange-500','bg-cyan-500','bg-pink-500'];
                return <span key={i} className={`${colors[i % colors.length]} text-white px-2.5 py-0.5 rounded-full text-xs font-semibold`}>{tag}</span>;
              })}
            </div>
          </div>
        )}
      </div>

      <div className="text-center py-3 text-xs text-gray-400 border-t border-gray-100">
        本简历由「运营简历精修工坊」AI 辅助生成
      </div>
    </div>
  );
}

/** 高亮数字和加粗 */
function highlightText(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<b class="text-gray-900">$1</b>')
    .replace(/(\d+(?:\.\d+)?%?)/g, '<span class="font-bold text-blue-600 bg-blue-50 px-1 rounded">$1</span>');
}

/** 板块图标映射 */
function getSectionIcon(icon: string): { iconClass: string; iconEmoji: string } {
  switch (icon) {
    case 'work': return { iconClass: 'bg-gradient-to-br from-blue-500 to-indigo-500', iconEmoji: '📋' };
    case 'project': return { iconClass: 'bg-gradient-to-br from-purple-500 to-pink-500', iconEmoji: '🚀' };
    case 'edu': return { iconClass: 'bg-gradient-to-br from-orange-500 to-red-500', iconEmoji: '🎓' };
    case 'skill': return { iconClass: 'bg-gradient-to-br from-green-500 to-emerald-500', iconEmoji: '🛠️' };
    case 'summary': return { iconClass: 'bg-gradient-to-br from-cyan-500 to-teal-500', iconEmoji: '💡' };
    default: return { iconClass: 'bg-gradient-to-br from-blue-500 to-purple-500', iconEmoji: '📋' };
  }
}

/** 提取运营相关技能标签 */
function extractSkillTags(text: string): string[] {
  const patterns = [
    /AARRR|RFM|ROI|LTV|CAC|DAU|MAU|GMV|KPI|OKR|UGC|PGC|SEO|SEM|CRM|SCRM/g,
    /用户运营|活动运营|内容运营|社群运营|新媒体|数据运营|私域|公域/g,
    /裂变|增长|转化|留存|促活|拉新|召回|复购|渗透/g,
    /公众号|抖音|小红书|视频号|知乎|B站|微博|快手/g,
    /数据分析|SQL|Excel|Tableau|Power BI|Python/g,
  ];
  const tags: string[] = [];
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) tags.push(...matches);
  }
  const unique = [...new Set(tags)].slice(0, 8);
  if (unique.length === 0) {
    return ['运营', '数据分析', '用户增长', '内容策划'];
  }
  return unique;
}
