import React from 'react';
import { 
  Sparkles, 
  Users, 
  Dices, 
  Upload, 
  Volume2, 
  VolumeX, 
  GraduationCap
} from 'lucide-react';
import { Student } from '../types';

interface NavbarProps {
  activeTab: 'picker' | 'grouping';
  onChangeTab: (tab: 'picker' | 'grouping') => void;
  students: Student[];
  onOpenStudentManager: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onChangeTab,
  students,
  onOpenStudentManager,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
              <span>課堂抽籤與分組工具</span>
            </h1>
            <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
              專為老師課堂點名、抽籤互動與小組活動設計
            </p>
          </div>
        </div>

        {/* Center Mode Navigation */}
        <div className="flex items-center p-1 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            onClick={() => onChangeTab('picker')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'picker'
                ? 'bg-white text-indigo-700 shadow-xs scale-102'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Dices className="w-4 h-4 text-indigo-600" />
            <span>隨機抽籤點名</span>
          </button>

          <button
            onClick={() => onChangeTab('grouping')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === 'grouping'
                ? 'bg-white text-indigo-700 shadow-xs scale-102'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4 text-indigo-600" />
            <span>自動班級分組</span>
          </button>
        </div>

        {/* Right Tools & Student Count */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? '音效已開啟 (點擊靜音)' : '音效已關閉 (點擊開啟)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Student Roster Button */}
          <button
            onClick={onOpenStudentManager}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>名單管理</span>
            <span className="px-1.5 py-0.5 bg-indigo-500 text-white text-[11px] rounded-full font-extrabold">
              {students.length}
            </span>
          </button>
        </div>

      </div>
    </header>
  );
};
