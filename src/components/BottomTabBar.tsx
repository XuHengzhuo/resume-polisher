'use client';

import { MessageSquareText, ArrowLeftRight, Target, AlertTriangle, MessageCircle } from 'lucide-react';
import { useStore } from '@/store/useStore';

const TABS = [
  { id: 'suggestions' as const, label: '润色', icon: MessageSquareText },
  { id: 'diff' as const, label: '对比', icon: ArrowLeftRight },
  { id: 'ats' as const, label: 'ATS', icon: Target },
  { id: 'detect' as const, label: '检测', icon: AlertTriangle },
  { id: 'interview' as const, label: '面试', icon: MessageCircle },
];

interface BottomTabBarProps {
  onTabSelect: (tab: 'suggestions' | 'diff' | 'ats' | 'detect' | 'interview') => void;
}

export function BottomTabBar({ onTabSelect }: BottomTabBarProps) {
  const activePanel = useStore(s => s.activePanel);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-bottom z-40 md:hidden">
      <div className="flex items-center justify-around h-14">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activePanel === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabSelect(tab.id)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-0 flex-1 h-full transition-colors ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
