'use client';

import { useState, useMemo } from 'react';
import { X, FileText, FileDown, Copy, Check, Printer, Globe, Sparkles, RotateCcw, Eye } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { batchSafeReplace, cleanRecursiveDuplication } from '@/lib/dedup';
import { polishGrammar, polishVerbs } from '@/lib/api-client';

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

/** 根据格式生成预览内容 */
function renderPreview(text: string, format: ExportFormat): string {
  switch (format) {
    case 'pdf':
      return renderPDFPreview(text);
    case 'md':
      return text;
    case 'txt':
      return text;
    case 'html':
      return renderHTMLPreview(text);
  }
}

function renderPDFPreview(text: string): string {
  const lines = text.split('\n').filter(l => l.trim());
  return lines.map(line => {
    let formatted = line.replace(/\*\*(.*?)\*\*/g, '$1');
    if (line.startsWith('## ') || line.startsWith('### ')) {
      return `\n──── ${formatted.replace(/^#+\s*/, '')} ────\n`;
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return `   • ${formatted.replace(/^[-•]\s*/, '')}`;
    }
    return formatted;
  }).join('\n');
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

  const [open, setOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerated, setRegenerated] = useState(false);

  // 预览内容随格式和文本变化
  const previewContent = useMemo(
    () => renderPreview(resumeText, format),
    [resumeText, format]
  );

  /** 重新润色 */
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

  /** 导出当前选中格式 */
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

    const lines = resumeText.split('\n').filter(l => l.trim());

    // 解析简历结构
    let name = '个人简历';
    let subtitle = '';
    const sections: { title: string; items: string[] }[] = [];
    let currentSection: { title: string; items: string[] } | null = null;

    for (const line of lines) {
      if (line.startsWith('## ') || line.startsWith('### ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { title: line.replace(/^#+\s*/, ''), items: [] };
      } else if (currentSection) {
        currentSection.items.push(line);
      } else {
        // 第一段作为个人简介
        if (!name || name === '个人简历') {
          name = line.replace(/\*\*/g, '').slice(0, 30);
          if (line.length > 30) subtitle = line.slice(30);
        } else {
          if (!currentSection) {
            currentSection = { title: '工作经历', items: [] };
          }
          currentSection.items.push(line);
        }
      }
    }
    if (currentSection) sections.push(currentSection);
    if (sections.length === 0) {
      sections.push({ title: '工作经历', items: lines });
    }

    // 提取数字关键词作为技能标签
    const allText = resumeText;
    const skillTags: string[] = [];
    const skillPatterns = [
      { regex: /AARRR|RFM|ROI|LTV|CAC|DAU|MAU|GMV|KPI|OKR/g, label: '模型' },
      { regex: /用户运营|活动运营|内容运营|社群运营|新媒体|数据运营/g, label: '方向' },
      { regex: /裂变|增长|转化|留存|促活|拉新|召回/g, label: '手段' },
      { regex: /公众号|抖音|小红书|视频号|知乎|B站|微博/g, label: '渠道' },
    ];
    for (const { regex } of skillPatterns) {
      const matches = allText.match(regex);
      if (matches) skillTags.push(...matches);
    }
    const uniqueTags = [...new Set(skillTags)].slice(0, 8);
    if (uniqueTags.length === 0) {
      uniqueTags.push('运营', '数据分析', '用户增长', '内容策划');
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><title>个人简历 - 运营</title>
<style>
  @page { size: A4; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: "PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;
    font-size: 13px; line-height: 1.7; color: #2d3748;
    max-width: 210mm; margin: 0 auto;
  }
  /* ── 顶部横幅 ── */
  .header {
    background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 50%, #7c3aed 100%);
    color: white; padding: 32px 40px 28px;
    position: relative; overflow: hidden;
  }
  .header::after {
    content: ''; position: absolute; top: -40px; right: -30px;
    width: 160px; height: 160px; border-radius: 50%;
    background: rgba(255,255,255,0.06);
  }
  .header h1 { font-size: 28px; font-weight: 700; letter-spacing: 2px; margin-bottom: 6px; position: relative; z-index: 1; }
  .header .subtitle { font-size: 13px; opacity: 0.85; position: relative; z-index: 1; }
  .header .meta { display: flex; gap: 20px; margin-top: 12px; font-size: 12px; opacity: 0.8; position: relative; z-index: 1; }
  .header .meta span { display: flex; align-items: center; gap: 4px; }
  /* ── 内容区 ── */
  .content { padding: 28px 40px; }
  /* 章节标题 */
  .section { margin-bottom: 22px; }
  .section-title {
    font-size: 15px; font-weight: 700; color: #1e3a5f;
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 12px; padding-bottom: 6px;
    border-bottom: 2px solid #e2e8f0;
  }
  .section-title .icon {
    width: 28px; height: 28px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; color: white; flex-shrink: 0;
  }
  .icon-work { background: linear-gradient(135deg, #2563eb, #6366f1); }
  .icon-project { background: linear-gradient(135deg, #7c3aed, #a855f7); }
  .icon-skill { background: linear-gradient(135deg, #059669, #10b981); }
  .icon-edu { background: linear-gradient(135deg, #ea580c, #f97316); }
  /* 经历条目 */
  .exp-item {
    padding: 12px 16px; margin-bottom: 8px;
    background: #f8fafc; border-radius: 8px;
    border-left: 3px solid #2563eb;
    position: relative;
  }
  .exp-item:nth-child(2n) { border-left-color: #7c3aed; }
  .exp-item:nth-child(3n) { border-left-color: #059669; }
  .exp-item .bullet {
    display: inline-block; width: 6px; height: 6px; border-radius: 50%;
    background: #94a3b8; margin-right: 8px; vertical-align: middle;
  }
  .exp-item strong { color: #1e3a5f; }
  /* 技能标签 */
  .tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
  .tag {
    display: inline-block; padding: 4px 14px;
    border-radius: 20px; font-size: 11px; font-weight: 600;
    color: white;
  }
  .tag:nth-child(1) { background: #2563eb; }
  .tag:nth-child(2) { background: #7c3aed; }
  .tag:nth-child(3) { background: #059669; }
  .tag:nth-child(4) { background: #ea580c; }
  .tag:nth-child(5) { background: #0891b2; }
  .tag:nth-child(6) { background: #d946ef; }
  .tag:nth-child(7) { background: #65a30d; }
  .tag:nth-child(8) { background: #e11d48; }
  /* 量化数字高亮 */
  .metric { font-weight: 700; color: #2563eb; background: #eff6ff; padding: 1px 6px; border-radius: 3px; white-space: nowrap; }
  /* 页脚 */
  .footer { text-align: center; padding: 16px 40px 24px; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-print { display: none; }
  }
</style></head>
<body>
  <div class="no-print" style="background:#eff6ff;padding:10px 16px;text-align:center;font-size:13px;color:#2563eb;border-bottom:1px solid #bfdbfe;">
    💡 按 <strong>Ctrl+P</strong> → 目标打印机选 <strong>"另存为 PDF"</strong> → 边距选"无" → 保存
  </div>

  <!-- 顶部横幅 -->
  <div class="header">
    <h1>${escapeHTML(name)}</h1>
    <div class="subtitle">${subtitle ? escapeHTML(subtitle.slice(0, 60)) : '运营岗位求职简历'}</div>
    <div class="meta">
      <span>📍 由运营简历精修工坊生成</span>
    </div>
  </div>

  <div class="content">
    ${sections.map((section, si) => {
      const icons = ['icon-work', 'icon-project', 'icon-skill', 'icon-edu'];
      const iconEmojis = ['📋', '🚀', '🛠️', '🎓'];
      const iconClass = icons[si % icons.length];
      const iconEmoji = iconEmojis[si % iconEmojis.length];
      return `
    <div class="section">
      <div class="section-title">
        <div class="icon ${iconClass}">${iconEmoji}</div>
        ${escapeHTML(section.title)}
      </div>
      ${section.items.map((item, ii) => {
        let html = item
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/^[-•]\s*/, '');

        // 高亮数字指标
        html = html.replace(/(\d+(?:\.\d+)?%?)/g, '<span class="metric">$1</span>');

        if (item.startsWith('- ') || item.startsWith('• ')) {
          return `<div class="exp-item"><span class="bullet"></span>${html}</div>`;
        }
        return `<div class="exp-item"><span class="bullet"></span>${html}</div>`;
      }).join('')}
    </div>`;
    }).join('')}

    <!-- 技能标签 -->
    <div class="section">
      <div class="section-title">
        <div class="icon icon-skill">🛠️</div>
        核心能力
      </div>
      <div class="tag-cloud">
        ${uniqueTags.map(tag => `<span class="tag">${escapeHTML(tag)}</span>`).join('')}
      </div>
    </div>
  </div>

  <div class="footer">
    本简历由「运营简历精修工坊」AI 辅助生成 · 建议根据具体岗位进一步调整
  </div>

  <script>
    setTimeout(() => { document.title = '个人简历'; window.print(); }, 600);
  </script>
</body></html>`;
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileDown size={18} className="text-blue-500" />
                <h2 className="text-base font-semibold text-gray-800">导出简历</h2>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            {/* Body: 左右分屏 */}
            <div className="flex-1 flex overflow-hidden">
              {/* ── 左侧：格式选择 + 操作 ── */}
              <div className="w-[280px] flex-shrink-0 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">选择格式</label>
                  {FORMATS.map(f => (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
                      className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border-2 text-left transition-all ${
                        format === f.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className={`flex-shrink-0 ${format === f.id ? 'text-blue-600' : 'text-gray-400'}`}>{f.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-800">{f.label}</div>
                        <div className="text-xs text-gray-400 truncate">{f.desc}</div>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        format === f.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {format === f.id && <Check size={10} className="text-white" />}
                      </div>
                    </button>
                  ))}

                  {/* 分隔 */}
                  <div className="border-t border-gray-200 my-2" />

                  {/* 重新润色按钮 */}
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-xl hover:bg-purple-100 transition-colors disabled:opacity-60"
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
                <div className="p-4 border-t border-gray-200 bg-white space-y-2">
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
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-white flex-shrink-0">
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

                {/* 预览区 */}
                <div className="flex-1 overflow-y-auto p-4">
                  {format === 'pdf' ? (
                    /* PDF 格式 — 模板风格预览 */
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden max-w-[210mm] mx-auto border border-gray-200" style={{ fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif' }}>
                      {/* 顶部横幅 */}
                      <div className="bg-gradient-to-r from-blue-900 via-blue-600 to-purple-600 text-white px-6 py-5">
                        <h1 className="text-lg font-bold tracking-wide">个人简历</h1>
                        <p className="text-xs opacity-80 mt-1">运营岗位求职简历</p>
                        <div className="text-xs opacity-70 mt-2">📍 由运营简历精修工坊生成</div>
                      </div>
                      <div className="p-5 space-y-4">
                        {/* 简历内容 */}
                        {resumeText.split('\n').filter(l => l.trim()).map((line, i) => {
                          if (line.startsWith('## ') || line.startsWith('### ')) {
                            return (
                              <div key={i} className="flex items-center gap-2 pt-3 pb-1 border-b-2 border-gray-100">
                                <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs">📋</div>
                                <span className="text-sm font-bold text-gray-800">{line.replace(/^#+\s*/, '')}</span>
                              </div>
                            );
                          }
                          if (line.startsWith('- ') || line.startsWith('• ')) {
                            const text = line.replace(/^[-•]\s*/, '');
                            const highlighted = text.replace(/\*\*(.*?)\*\*/g, '<b class="text-gray-900">$1</b>').replace(/(\d+(?:\.\d+)?%?)/g, '<span class="font-bold text-blue-600 bg-blue-50 px-1 rounded">$1</span>');
                            return (
                              <div key={i} className="ml-4 pl-3 py-1.5 bg-gray-50 rounded-md border-l-2 border-blue-400 text-sm text-gray-700"
                                dangerouslySetInnerHTML={{ __html: '• ' + highlighted }} />
                            );
                          }
                          const highlighted = line.replace(/\*\*(.*?)\*\*/g, '<b class="text-gray-900">$1</b>').replace(/(\d+(?:\.\d+)?%?)/g, '<span class="font-bold text-blue-600 bg-blue-50 px-1 rounded">$1</span>');
                          return (
                            <div key={i} className="ml-4 pl-3 py-1.5 bg-gray-50 rounded-md border-l-2 border-purple-400 text-sm text-gray-700"
                              dangerouslySetInnerHTML={{ __html: highlighted }} />
                          );
                        })}
                        {/* 技能标签 */}
                        <div className="flex items-center gap-2 pt-3 pb-1 border-b-2 border-gray-100">
                          <div className="w-6 h-6 rounded bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs">🛠️</div>
                          <span className="text-sm font-bold text-gray-800">核心能力</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(() => {
                            const tags = resumeText.match(/公众号|裂变|增长|转化|留存|社群|内容运营|数据分析|用户运营|AARRR|RFM|ROI/g) || ['运营', '数据分析', '用户增长'];
                            return [...new Set(tags)].slice(0, 6).map((tag, i) => {
                              const colors = ['bg-blue-500','bg-purple-500','bg-green-500','bg-orange-500','bg-cyan-500','bg-pink-500'];
                              return <span key={i} className={`${colors[i]} text-white px-2.5 py-0.5 rounded-full text-xs font-semibold`}>{tag}</span>;
                            });
                          })()}
                        </div>
                      </div>
                      <div className="text-center py-3 text-xs text-gray-400 border-t border-gray-100">
                        本简历由「运营简历精修工坊」AI 辅助生成
                      </div>
                    </div>
                  ) : format === 'html' ? (
                    /* HTML 预览 */
                    <div className="bg-white rounded-lg border border-gray-200 p-4 text-sm leading-relaxed" style={{ fontFamily: '"PingFang SC","Microsoft YaHei",sans-serif' }}>
                      <div className="mb-2 px-2 py-1 bg-gray-50 rounded text-xs text-gray-400 font-mono">HTML 渲染效果</div>
                      <div dangerouslySetInnerHTML={{ __html: renderHTMLPreview(resumeText) }} />
                    </div>
                  ) : (
                    /* MD / TXT 预览 */
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
