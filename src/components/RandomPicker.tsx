import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Sparkles, 
  RotateCcw, 
  Settings2, 
  History, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  AlertCircle,
  HelpCircle,
  Undo2,
  Trash2,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Student, DrawMode, DrawHistoryItem } from '../types';
import { soundManager } from '../utils/audio';

interface RandomPickerProps {
  students: Student[];
  onOpenStudentManager: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const RandomPicker: React.FC<RandomPickerProps> = ({
  students,
  onOpenStudentManager,
  soundEnabled,
  onToggleSound,
}) => {
  // Mode: 'without-replacement' (不重複) vs 'with-replacement' (可重複)
  const [drawMode, setDrawMode] = useState<DrawMode>('without-replacement');
  
  // Available pool for non-replacement mode
  const [availableStudentIds, setAvailableStudentIds] = useState<string[]>([]);
  
  // Current active display during spinning
  const [displayedStudent, setDisplayedStudent] = useState<Student | null>(null);
  
  // Final picked student
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Animation state
  const [isRolling, setIsRolling] = useState(false);
  
  // Draw duration setting (ms): 1500 (快), 3000 (標準), 5000 (懸疑)
  const [spinDuration, setSpinDuration] = useState<number>(3000);
  
  // History log
  const [history, setHistory] = useState<DrawHistoryItem[]>([]);
  
  // UI Panels
  const [showHistory, setShowHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sync available IDs when student roster or mode changes
  useEffect(() => {
    setAvailableStudentIds(students.map(s => s.id));
    if (students.length > 0 && !selectedStudent && !displayedStudent) {
      setDisplayedStudent(students[0]);
    }
  }, [students]);

  // Compute available students list
  const availableStudents = students.filter(s => availableStudentIds.includes(s.id));
  const poolToDrawFrom = drawMode === 'without-replacement' ? availableStudents : students;

  // Trigger celebration confetti
  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6366f1', '#a855f7', '#ec4899'],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#3b82f6', '#10b981', '#f59e0b'],
        });
      }, 200);
    } catch {
      // ignore
    }
  };

  // Perform Random Pick
  const startDraw = useCallback(() => {
    if (isRolling) return;
    if (poolToDrawFrom.length === 0) return;

    setIsRolling(true);
    setSelectedStudent(null);
    soundManager.playClick();

    // Determine the lucky winner beforehand
    const winnerIndex = Math.floor(Math.random() * poolToDrawFrom.length);
    const winner = poolToDrawFrom[winnerIndex];

    const startTime = performance.now();
    const duration = spinDuration;
    let lastTickTime = startTime;
    let currentInterval = 40; // Starts fast (40ms)

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Deceleration easing function: cubic-bezier-like deceleration
      // interval gradually stretches from ~40ms to ~320ms near the end
      currentInterval = 40 + Math.pow(progress, 2.5) * 280;

      if (currentTime - lastTickTime >= currentInterval) {
        lastTickTime = currentTime;

        // Pick a random student from total roster to cycle display
        const randomPreview = students[Math.floor(Math.random() * students.length)];
        setDisplayedStudent(randomPreview);

        // Sound effect: pitch scales slightly down as it decelerates
        const pitch = Math.max(0.6, 1.2 - progress * 0.5);
        if (progress > 0.85) {
          soundManager.playTensionDing(700 + (1 - progress) * 300);
        } else {
          soundManager.playTick(pitch);
        }
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        // FINISHED! Reveal the winner
        setDisplayedStudent(winner);
        setSelectedStudent(winner);
        setIsRolling(false);

        // Audio & Confetti
        soundManager.playVictoryFanfare();
        triggerConfetti();

        // Update history
        const historyItem: DrawHistoryItem = {
          id: `hist-${Date.now()}`,
          student: winner,
          timestamp: Date.now(),
          round: history.length + 1,
        };
        setHistory(prev => [historyItem, ...prev]);

        // If non-replacement, remove from available IDs
        if (drawMode === 'without-replacement') {
          setAvailableStudentIds(prev => prev.filter(id => id !== winner.id));
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);
  }, [isRolling, poolToDrawFrom, students, spinDuration, drawMode, history.length]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Keyboard shortcut: Spacebar to draw
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRolling && poolToDrawFrom.length > 0) {
        // Prevent default spacebar scrolling if not focused on text input
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') {
          e.preventDefault();
          startDraw();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRolling, poolToDrawFrom.length, startDraw]);

  // Reset pool for non-replacement mode
  const resetPool = () => {
    setAvailableStudentIds(students.map(s => s.id));
    soundManager.playClick();
  };

  // Put a specific student back into the available pool
  const returnToPool = (studentId: string) => {
    if (!availableStudentIds.includes(studentId)) {
      setAvailableStudentIds(prev => [...prev, studentId]);
      soundManager.playClick();
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (students.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">尚未載入學生名單</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
          請先匯入班級 CSV 檔案或直接貼上學生姓名，才能開始進行隨機抽籤點名。
        </p>
        <button
          onClick={onOpenStudentManager}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md transition-colors"
        >
          匯入學生名單
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-6 max-w-5xl mx-auto pb-12">
      
      {/* Settings & Mode Control Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        
        {/* Draw Mode Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            抽取模式
          </span>
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => {
                setDrawMode('without-replacement');
                soundManager.playClick();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                drawMode === 'without-replacement'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              不重複抽取（每人抽一次）
            </button>
            <button
              onClick={() => {
                setDrawMode('with-replacement');
                soundManager.playClick();
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                drawMode === 'with-replacement'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              可重複抽取（機率均等）
            </button>
          </div>
        </div>

        {/* Speed & Sound & Fullscreen Controls */}
        <div className="flex items-center gap-2.5">
          {/* Duration Selector */}
          <div className="flex items-center space-x-1 text-xs bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-slate-500 font-medium">轉動時間:</span>
            <select
              value={spinDuration}
              onChange={(e) => setSpinDuration(Number(e.target.value))}
              disabled={isRolling}
              className="bg-transparent font-bold text-slate-700 focus:outline-hidden cursor-pointer"
            >
              <option value={1500}>快速 (1.5秒)</option>
              <option value={3000}>標準 (3秒)</option>
              <option value={5000}>懸疑 (5秒)</option>
            </select>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className={`p-2 rounded-xl border transition-colors ${
              soundEnabled
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                : 'bg-slate-100 border-slate-200 text-slate-400'
            }`}
            title={soundEnabled ? '音效已開啟 (點擊靜音)' : '音效已靜音 (點擊開啟)'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors"
            title="課堂全螢幕投影"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

      </div>

      {/* Main Drawing Stage Area */}
      <div className="relative bg-gradient-to-b from-white to-slate-50 rounded-3xl p-8 sm:p-12 border border-slate-200/90 shadow-lg text-center overflow-hidden">
        
        {/* Subtle decorative background circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-6 border border-slate-200">
          <span>
            {drawMode === 'without-replacement' ? (
              <>
                待抽名單：<strong className="text-indigo-600 font-bold text-sm">{availableStudents.length}</strong> / 全班 {students.length} 人
              </>
            ) : (
              <>
                可重複名單：全班 <strong className="text-indigo-600 font-bold text-sm">{students.length}</strong> 人皆有機會
              </>
            )}
          </span>
          {drawMode === 'without-replacement' && availableStudents.length < students.length && (
            <button
              onClick={resetPool}
              disabled={isRolling}
              className="ml-2 text-indigo-600 hover:text-indigo-800 underline text-xs font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> 重置籤筒
            </button>
          )}
        </div>

        {/* Big Projection Student Card */}
        <div className="my-6 min-h-[220px] sm:min-h-[260px] flex items-center justify-center">
          {poolToDrawFrom.length === 0 && !isRolling && !selectedStudent ? (
            /* All drawn state in without-replacement mode */
            <div className="bg-amber-50 border border-amber-200 rounded-3xl p-8 max-w-md mx-auto animate-in zoom-in-95 duration-200">
              <CheckCircle2 className="w-12 h-12 text-amber-600 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-slate-800 mb-1">恭喜！全班學生皆已抽過一輪</h3>
              <p className="text-xs text-slate-500 mb-5">
                目前待抽池中已無學生。您可以點擊下方按鈕將全班名單放回籤筒，重新開始新一輪抽籤！
              </p>
              <button
                onClick={resetPool}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md transition-colors inline-flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                重新洗牌，放回全班名單
              </button>
            </div>
          ) : (
            /* Active display card */
            <div
              className={`w-full max-w-lg mx-auto p-8 rounded-3xl transition-all duration-200 ${
                isRolling
                  ? 'bg-indigo-50/70 border-2 border-indigo-400 scale-102 shadow-xl ring-8 ring-indigo-100/50'
                  : selectedStudent
                  ? 'bg-gradient-to-b from-amber-50/80 to-white border-2 border-amber-400 shadow-2xl scale-105 ring-8 ring-amber-100/60'
                  : 'bg-white border border-slate-200 shadow-md'
              }`}
            >
              {/* Badge: Seat number */}
              <div className="mb-3">
                {displayedStudent?.number ? (
                  <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-bold tracking-wide ${
                    selectedStudent 
                      ? 'bg-amber-500 text-white shadow-xs' 
                      : isRolling 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    座號 #{displayedStudent.number}
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 text-xs text-slate-400 font-medium">
                    {isRolling ? '抽籤中...' : selectedStudent ? '🎉 幸運中選！' : '準備抽籤'}
                  </span>
                )}
              </div>

              {/* Main Student Name Typography */}
              <div className={`font-black tracking-wider transition-all duration-100 select-none ${
                isRolling 
                  ? 'text-5xl sm:text-7xl text-indigo-900 blur-2xs' 
                  : selectedStudent 
                  ? 'text-5xl sm:text-7xl text-slate-900 scale-100' 
                  : 'text-4xl sm:text-6xl text-slate-400'
              }`}>
                {displayedStudent ? displayedStudent.name : '點擊開始抽籤'}
              </div>

              {/* Reveal Subtitle */}
              {selectedStudent && !isRolling && (
                <div className="mt-4 flex items-center justify-center gap-2 text-amber-700 text-sm font-bold animate-in fade-in slide-in-from-bottom-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>恭喜！請上台發言或回答問題</span>
                  <Sparkles className="w-4 h-4 text-amber-500" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Primary Action Controls */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={startDraw}
            disabled={isRolling || poolToDrawFrom.length === 0}
            className={`w-full sm:w-auto min-w-[220px] px-8 py-4 rounded-2xl font-black text-lg tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-lg ${
              isRolling
                ? 'bg-indigo-400 text-white cursor-not-allowed'
                : poolToDrawFrom.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105 active:scale-98 shadow-indigo-200'
            }`}
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span>{isRolling ? '抽籤中...' : selectedStudent ? '抽下一位學生' : '開始隨機抽籤'}</span>
          </button>

          {/* Quick Spacebar hint */}
          <div className="hidden sm:flex items-center text-xs text-slate-400 gap-1.5 px-3 py-2">
            <span>或按</span>
            <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-700 shadow-2xs">
              空白鍵 Space
            </kbd>
            <span>抽籤</span>
          </div>

          {/* Return to pool button if teacher needs */}
          {selectedStudent && drawMode === 'without-replacement' && (
            <button
              onClick={() => {
                if (selectedStudent) returnToPool(selectedStudent.id);
              }}
              className="px-4 py-3 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
              title="若學生請假或需要重新抽，可將此學生放回待抽籤筒"
            >
              <Undo2 className="w-3.5 h-3.5" />
              將 {selectedStudent.name} 放回籤筒
            </button>
          )}
        </div>

      </div>

      {/* History & Statistics Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">
              抽籤歷史紀錄 ({history.length} 次)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('確定要清空抽籤歷程紀錄嗎？')) {
                    setHistory([]);
                  }
                }}
                className="text-xs text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                清空紀錄
              </button>
            )}
          </div>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            目前尚無抽籤紀錄，點擊「開始隨機抽籤」開啟課堂互動！
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
            {history.map((item, idx) => (
              <div
                key={item.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs transition-colors"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                  {history.length - idx}
                </span>
                <span className="font-bold text-slate-800">{item.student.name}</span>
                {item.student.number && (
                  <span className="text-slate-400 text-[11px]">#{item.student.number}</span>
                )}
                <span className="text-[10px] text-slate-400">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
