/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Student } from './types';
import { generateSampleStudents } from './utils/csvParser';
import { soundManager } from './utils/audio';
import { Navbar } from './components/Navbar';
import { RandomPicker } from './components/RandomPicker';
import { GroupGenerator } from './components/GroupGenerator';
import { StudentManagerModal } from './components/StudentManagerModal';
import { Users, Sparkles, FileSpreadsheet, Dices, ChevronRight } from 'lucide-react';

const LOCAL_STORAGE_KEY = 'classroom_picker_students_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'picker' | 'grouping'>('picker');
  const [isStudentManagerOpen, setIsStudentManagerOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize students from localStorage or generate nice sample class
  const [students, setStudents] = useState<Student[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {
        // fallback
      }
    }
    // Default initial demonstration students so teacher has immediate test data
    return generateSampleStudents();
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(students));
    } catch {
      // ignore
    }
  }, [students]);

  // Toggle sound
  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundManager.enabled = next;
    if (next) {
      soundManager.playClick();
    }
  };

  const handleUpdateStudents = (newStudents: Student[]) => {
    setStudents(newStudents);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        students={students}
        onOpenStudentManager={() => setIsStudentManagerOpen(true)}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
      />

      {/* Main Classroom Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Quick Roster Status Notification bar if loaded */}
        <div className="mb-6 bg-white border border-slate-200/90 rounded-2xl px-5 py-3 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 text-xs sm:text-sm">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-600 font-medium">目前名單來源：</span>
              <strong className="text-slate-900 font-bold ml-1">
                已載入 {students.length} 位學生
              </strong>
              <span className="text-slate-400 text-xs ml-2 hidden md:inline">
                （支援 CSV 檔案上傳與姓名貼上）
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsStudentManagerOpen(true)}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline transition-all"
          >
            <span>更換或管理學生名單</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab 1: Random Picker (功能1) */}
        {activeTab === 'picker' && (
          <RandomPicker
            students={students}
            onOpenStudentManager={() => setIsStudentManagerOpen(true)}
            soundEnabled={soundEnabled}
            onToggleSound={handleToggleSound}
          />
        )}

        {/* Tab 2: Group Generator (功能2) */}
        {activeTab === 'grouping' && (
          <GroupGenerator
            students={students}
            onOpenStudentManager={() => setIsStudentManagerOpen(true)}
          />
        )}

      </main>

      {/* Student Manager Modal */}
      <StudentManagerModal
        isOpen={isStudentManagerOpen}
        onClose={() => setIsStudentManagerOpen(false)}
        students={students}
        onUpdateStudents={handleUpdateStudents}
      />

      {/* Footer */}
      <footer className="py-4 border-t border-slate-200/60 text-center text-xs text-slate-400">
        課堂教學小助手 · 支援 CSV 匯入、音效動畫抽籤與自動分組
      </footer>

    </div>
  );
}
