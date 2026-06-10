'use client';

import { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function MobileBottomSheet({ open, onClose, title, children }: MobileBottomSheetProps) {
  const [animating, setAnimating] = useState(false);
  const [visible, setVisible] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  useEffect(() => {
    if (open) {
      setVisible(true);
      requestAnimationFrame(() => setAnimating(true));
    } else {
      setAnimating(false);
      setTimeout(() => setVisible(false), 300);
    }
  }, [open]);

  if (!visible) return null;

  const close = () => {
    setAnimating(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* 遮罩 */}
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${animating ? 'opacity-100' : 'opacity-0'}`}
        onClick={close}
      />

      {/* 面板 */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl flex flex-col transition-transform duration-300 ${
          animating ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '88vh', height: '85vh' }}
      >
        {/* 拖拽条 */}
        <div className="flex-shrink-0 flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 flex-shrink-0">
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          <button
            onClick={close}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
