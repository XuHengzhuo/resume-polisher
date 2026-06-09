'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, RotateCcw } from 'lucide-react';
import { useStore } from '@/store/useStore';

export function QuantifyModal() {
  const open = useStore(s => s.quantifyModalOpen);
  const setOpen = useStore(s => s.setQuantifyModalOpen);
  const selectedText = useStore(s => s.quantifySelectedText);
  const resumeText = useStore(s => s.resumeText);
  const setResumeText = useStore(s => s.setResumeText);
  const addSnapshot = useStore(s => s.addSnapshot);

  const [absoluteValue, setAbsoluteValue] = useState('');
  const [growthRate, setGrowthRate] = useState('');
  const [timeRange, setTimeRange] = useState('');
  const [metricName, setMetricName] = useState('');
  const [baselineValue, setBaselineValue] = useState('');
  const [generatedSentence, setGeneratedSentence] = useState('');
  const [copied, setCopied] = useState(false);

  // 重置表单
  useEffect(() => {
    if (open) {
      setAbsoluteValue('');
      setGrowthRate('');
      setTimeRange('');
      setMetricName('');
      setBaselineValue('');
      setGeneratedSentence('');
    }
  }, [open]);

  if (!open) return null;

  const generateSentence = () => {
    let sentence = '';

    // 根据选中的文本类型生成不同模板
    if (selectedText.includes('提升') || selectedText.includes('增长') || selectedText.includes('涨')) {
      const parts: string[] = [];
      if (timeRange) parts.push(`在${timeRange}内`);
      if (metricName) parts.push(`${metricName}`);
      if (baselineValue) parts.push(`从${baselineValue}`);
      if (absoluteValue) parts.push(`提升至${absoluteValue}`);
      if (growthRate) parts.push(`增长${growthRate}%`);
      sentence = parts.join('，');
    } else if (selectedText.includes('转化') || selectedText.includes('留存')) {
      const parts: string[] = [];
      if (timeRange) parts.push(`在${timeRange}内`);
      if (metricName) parts.push(`${metricName}`);
      if (baselineValue && absoluteValue) {
        parts.push(`从${baselineValue}%提升至${absoluteValue}%`);
      }
      if (growthRate) parts.push(`环比增长${growthRate}%`);
      sentence = parts.join('，');
    } else {
      const parts: string[] = [];
      if (timeRange) parts.push(`在${timeRange}内`);
      if (metricName) parts.push(`通过优化${metricName}`);
      if (absoluteValue) parts.push(`实现${absoluteValue}`);
      if (growthRate) parts.push(`增长${growthRate}%`);
      sentence = parts.join('，');
    }

    if (!sentence) sentence = '请在下方至少填写一个字段';
    setGeneratedSentence(sentence);
  };

  const handleApply = () => {
    if (!generatedSentence || generatedSentence === '请在下方至少填写一个字段') return;
    addSnapshot('量化修改前自动保存');
    const newText = resumeText.replace(selectedText, generatedSentence);
    setResumeText(newText);
    setOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedSentence);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-800">🔮 量化魔法棒</h2>
          </div>
          <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* 选中的文本 */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">选中文本</label>
            <div className="mt-1 p-3 bg-purple-50 text-purple-800 text-sm rounded-lg border border-purple-200 font-medium">
              &ldquo;{selectedText}&rdquo;
            </div>
          </div>

          <p className="text-xs text-gray-400">
            选择以下至少一个维度填写，AI 将自动生成包含数据的完整句子
          </p>

          {/* 填空表单 */}
          <div className="space-y-3">
            <FormField
              label="指标名称"
              placeholder="如：新增用户数、转化率、留存率"
              value={metricName}
              onChange={setMetricName}
              icon="📊"
            />
            <FormField
              label="时间段"
              placeholder="如：3个月、Q2季度、活动期间"
              value={timeRange}
              onChange={setTimeRange}
              icon="📅"
            />
            <FormField
              label="基准值"
              placeholder="如：1000、15%"
              value={baselineValue}
              onChange={setBaselineValue}
              icon="📏"
            />
            <FormField
              label="绝对数值"
              placeholder="如：5000人、20万元"
              value={absoluteValue}
              onChange={setAbsoluteValue}
              icon="🎯"
            />
            <FormField
              label="增长率 (%)"
              placeholder="如：30"
              value={growthRate}
              onChange={setGrowthRate}
              icon="📈"
            />
          </div>

          {/* 生成按钮 */}
          <button
            onClick={generateSentence}
            className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all shadow-md hover:shadow-lg"
          >
            <Sparkles size={16} className="inline mr-1" />
            生成量化句子
          </button>

          {/* 生成结果 */}
          {generatedSentence && (
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-green-800 font-medium">{generatedSentence}</p>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={handleCopy}
                    className="p-1.5 text-green-600 hover:text-green-800 rounded-lg hover:bg-green-100 transition-colors"
                    title="复制"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleApply}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  <Check size={14} /> 应用到简历
                </button>
                <button
                  onClick={() => setGeneratedSentence('')}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <RotateCcw size={14} /> 重新生成
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({
  label, placeholder, value, onChange, icon,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-gray-600 flex items-center gap-1">
        <span>{icon}</span> {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all"
      />
    </div>
  );
}
