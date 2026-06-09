'use client';

import { useRef, useCallback, useEffect } from 'react';
import { Upload, ClipboardPaste, FileText } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { DensityDashboard } from './DensityDashboard';

export function ResumeEditor() {
  const resumeText = useStore(s => s.resumeText);
  const setResumeText = useStore(s => s.setResumeText);
  const loading = useStore(s => s.loading);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 自动保存到 localStorage
  useEffect(() => {
    const saved = localStorage.getItem('resume-polisher-text');
    if (saved) {
      setResumeText(saved);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('resume-polisher-text', resumeText);
    }, 500);
    return () => clearTimeout(timer);
  }, [resumeText]);

  const handlePaste = useCallback(async () => {
    try {
      const text = await navigator.clipboard.readText();
      setResumeText(text);
    } catch {
      alert('无法读取剪贴板，请手动粘贴（Ctrl+V）');
    }
  }, [setResumeText]);

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.txt')) {
        const text = await file.text();
        setResumeText(text);
      } else if (file.name.endsWith('.docx')) {
        const mammoth = await import('mammoth');
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setResumeText(result.value);
      } else {
        alert('仅支持 .txt 和 .docx 格式');
      }
    } catch {
      alert('文件解析失败，请检查文件格式');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [setResumeText]);

  const handleSelect = useCallback(() => {
    const textarea = document.getElementById('resume-textarea') as HTMLTextAreaElement;
    if (textarea) {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      if (selected.trim()) {
        useStore.getState().setQuantifySelectedText(selected.trim());
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* 顶部工具栏 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 bg-gray-50 flex-shrink-0">
        <button
          onClick={handlePaste}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          title="粘贴剪贴板内容"
        >
          <ClipboardPaste size={14} />
          粘贴文本
        </button>
        <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <Upload size={14} />
          上传文件
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
        <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
          <FileText size={12} />
          支持 .txt / .docx
        </span>
      </div>

      {/* 编辑区 */}
      <textarea
        id="resume-textarea"
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        onMouseUp={handleSelect}
        onKeyUp={handleSelect}
        className="flex-1 w-full p-4 resize-none focus:outline-none text-sm leading-relaxed font-mono text-gray-800 bg-white placeholder-gray-400"
        placeholder="在此粘贴或输入您的运营简历..."
        disabled={loading}
        spellCheck={false}
      />

      {/* 底部仪表盘 */}
      <DensityDashboard />
    </div>
  );
}
