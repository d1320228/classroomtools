import React, { useState, useRef, useMemo } from 'react';
import { 
  Upload, 
  FileText, 
  Users, 
  Trash2, 
  Plus, 
  Download, 
  Sparkles, 
  X, 
  Check, 
  AlertCircle,
  Search,
  Copy,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { Student } from '../types';
import { parseCSVContent, parsePastedNames, generateSampleStudents } from '../utils/csvParser';
import { SAMPLE_CLASSES, getSampleStudentsByClassId } from '../utils/sampleData';
import { soundManager } from '../utils/audio';

interface StudentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onUpdateStudents: (newStudents: Student[]) => void;
}

export const StudentManagerModal: React.FC<StudentManagerModalProps> = ({
  isOpen,
  onClose,
  students,
  onUpdateStudents,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'manage' | 'sample'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNumber, setNewStudentNumber] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Staged preview list for file upload or pasted text before final commit
  const [stagedStudents, setStagedStudents] = useState<Student[] | null>(null);
  const [stagedSource, setStagedSource] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate duplicate names in current students list
  const duplicateNameCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    students.forEach(s => {
      const trimmed = s.name.trim();
      counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
    });
    return counts;
  }, [students]);

  // Duplicate names list for current list
  const currentDuplicatesList = useMemo(() => {
    const dupes: string[] = [];
    duplicateNameCountMap.forEach((count, name) => {
      if (count > 1) dupes.push(name);
    });
    return dupes;
  }, [duplicateNameCountMap]);

  // Calculate duplicates in staged preview list
  const stagedDuplicateMap = useMemo(() => {
    if (!stagedStudents) return new Map<string, number>();
    const counts = new Map<string, number>();
    stagedStudents.forEach(s => {
      const trimmed = s.name.trim();
      counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
    });
    return counts;
  }, [stagedStudents]);

  const stagedDuplicatesList = useMemo(() => {
    if (!stagedStudents) return [];
    const dupes: string[] = [];
    stagedDuplicateMap.forEach((count, name) => {
      if (count > 1) dupes.push(name);
    });
    return dupes;
  }, [stagedDuplicateMap, stagedStudents]);

  if (!isOpen) return null;

  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3500);
  };

  // Helper: Deduplicate an array of students by name (preserving first occurrence)
  const deduplicateStudents = (list: Student[]): { unique: Student[]; removedCount: number } => {
    const seen = new Set<string>();
    const unique: Student[] = [];
    let removedCount = 0;

    list.forEach(item => {
      const key = item.name.trim();
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      } else {
        removedCount++;
      }
    });

    return { unique, removedCount };
  };

  // One-click remove duplicates from current student list
  const handleRemoveCurrentDuplicates = () => {
    const { unique, removedCount } = deduplicateStudents(students);
    if (removedCount === 0) {
      showNotification('目前名單中沒有重複的學生姓名', 'success');
      return;
    }
    onUpdateStudents(unique);
    soundManager.playClick();
    showNotification(`已一鍵移除 ${removedCount} 個重複姓名，保留唯一學生！`, 'success');
  };

  // One-click remove duplicates from staged preview list
  const handleRemoveStagedDuplicates = () => {
    if (!stagedStudents) return;
    const { unique, removedCount } = deduplicateStudents(stagedStudents);
    if (removedCount === 0) {
      showNotification('預覽名單中沒有重複的學生姓名', 'success');
      return;
    }
    setStagedStudents(unique);
    soundManager.playClick();
    showNotification(`已為預覽名單移除 ${removedCount} 個重複姓名！`, 'success');
  };

  // Confirm and apply staged list to active students
  const handleApplyStagedStudents = () => {
    if (!stagedStudents || stagedStudents.length === 0) return;
    onUpdateStudents(stagedStudents);
    soundManager.playGroupCompleteSound();
    showNotification(`成功匯入 ${stagedStudents.length} 位學生！`, 'success');
    setStagedStudents(null);
    setPastedText('');
    setActiveTab('manage');
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSVContent(text);
        if (parsed.length === 0) {
          showNotification('無法讀取名單，請確認 CSV 格式包含姓名欄位！', 'error');
          return;
        }

        // Check if there are duplicates
        const tempMap = new Map<string, number>();
        parsed.forEach(s => {
          const t = s.name.trim();
          tempMap.set(t, (tempMap.get(t) || 0) + 1);
        });
        const hasDupes = Array.from(tempMap.values()).some(cnt => cnt > 1);

        setStagedStudents(parsed);
        setStagedSource(`CSV 檔案: ${file.name}`);
        soundManager.playClick();

        if (hasDupes) {
          showNotification('已讀取檔案，發現有重複姓名，可在預覽中一鍵移除！', 'warning');
        } else {
          showNotification(`成功讀取 ${parsed.length} 位學生資料，請確認後套用！`, 'success');
        }
      } catch (err) {
        showNotification('解析檔案失敗，請檢查檔案編碼是否為 UTF-8 或標準格式', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handlePreviewPasted = () => {
    const parsed = parsePastedNames(pastedText);
    if (parsed.length === 0) {
      showNotification('未偵測到有效姓名，請輸入至少一名學生！', 'error');
      return;
    }

    const tempMap = new Map<string, number>();
    parsed.forEach(s => {
      const t = s.name.trim();
      tempMap.set(t, (tempMap.get(t) || 0) + 1);
    });
    const hasDupes = Array.from(tempMap.values()).some(cnt => cnt > 1);

    setStagedStudents(parsed);
    setStagedSource('剪貼簿貼上文字');
    soundManager.playClick();

    if (hasDupes) {
      showNotification('已解析名單，發現有重複姓名，可在預覽中一鍵移除！', 'warning');
    } else {
      showNotification(`成功解析 ${parsed.length} 位學生，請確認後套用！`, 'success');
    }
  };

  const handleLoadSampleClass = (classId: string) => {
    const samples = getSampleStudentsByClassId(classId);
    onUpdateStudents(samples);
    soundManager.playGroupCompleteSound();
    const target = SAMPLE_CLASSES.find(c => c.id === classId);
    showNotification(`已載入模擬名單：${target?.title || '示範名單'}（共 ${samples.length} 人）！`);
    setActiveTab('manage');
  };

  const handleAddSingleStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;

    const trimmed = newStudentName.trim();
    const isDup = students.some(s => s.name.trim() === trimmed);

    const newStudent: Student = {
      id: `student-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      number: newStudentNumber.trim() || String(students.length + 1).padStart(2, '0'),
    };

    onUpdateStudents([...students, newStudent]);
    setNewStudentName('');
    setNewStudentNumber('');
    soundManager.playClick();
    if (isDup) {
      showNotification(`已新增學生：${trimmed}（注意：名單中已有同名學生）`, 'warning');
    } else {
      showNotification(`已新增學生：${trimmed}`);
    }
  };

  const handleDeleteStudent = (id: string) => {
    onUpdateStudents(students.filter(s => s.id !== id));
    soundManager.playClick();
  };

  const handleClearAll = () => {
    if (window.confirm('確定要清空整份學生名單嗎？')) {
      onUpdateStudents([]);
      showNotification('已清空學生名單');
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) return;
    const csvContent = '\uFEFF' + ['座號,姓名', ...students.map(s => `"${s.number || ''}","${s.name}"`)].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `班級學生名單_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('已匯出學生名單 CSV');
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.number && s.number.includes(searchQuery))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">學生名單管理</h2>
              <p className="text-xs text-slate-400">目前名單共 {students.length} 位學生</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="關閉視窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className={`px-4 py-2.5 text-sm flex items-center space-x-2 transition-all ${
            notification.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200' 
              : notification.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border-b border-amber-200'
              : 'bg-rose-50 text-rose-800 border-b border-rose-200'
          }`}>
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : notification.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-medium text-xs sm:text-sm">{notification.message}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 space-x-1 sm:space-x-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center space-x-1.5 sm:space-x-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'upload'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>上傳 CSV 檔案</span>
          </button>

          <button
            onClick={() => setActiveTab('paste')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center space-x-1.5 sm:space-x-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'paste'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>貼上學生姓名</span>
          </button>

          <button
            onClick={() => setActiveTab('sample')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center space-x-1.5 sm:space-x-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'sample'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>模擬名單</span>
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 flex items-center space-x-1.5 sm:space-x-2 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'manage'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>目前名單 ({students.length})</span>
            {currentDuplicatesList.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" title="有名單重複" />
            )}
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* Staged Preview Modal/Section (Shows when file uploaded or paste previewed) */}
          {stagedStudents !== null && (
            <div className="mb-6 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-200 space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white text-[11px] font-bold rounded-md">
                      名單預覽確認
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">
                      來源：{stagedSource}（共 {stagedStudents.length} 人）
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    請檢視預覽名單。若發現重複姓名，系統已為您特別標記，您可一鍵移除重複項目。
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setStagedStudents(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg cursor-pointer"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleApplyStagedStudents}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    確認並套用名單
                  </button>
                </div>
              </div>

              {/* Duplicate Banner in Staged List */}
              {stagedDuplicatesList.length > 0 ? (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                    <div className="text-xs text-amber-900">
                      <span className="font-bold">發現重複姓名！</span>
                      <span> 共有 {stagedDuplicatesList.length} 個姓名重複出現（例如：{stagedDuplicatesList.slice(0, 3).join('、')}{stagedDuplicatesList.length > 3 ? '...' : ''}）。已在下方以橘黃色標記。</span>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveStagedDuplicates}
                    className="px-3 py-1.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                    一鍵移除重複姓名
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center gap-2 text-xs text-emerald-800 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>名單檢核完成：未發現任何重複姓名，格式良好！</span>
                </div>
              )}

              {/* Staged Items Preview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {stagedStudents.map((student, idx) => {
                  const isDup = (stagedDuplicateMap.get(student.name.trim()) || 0) > 1;
                  return (
                    <div
                      key={student.id || idx}
                      className={`flex items-center justify-between p-2 rounded-lg text-xs border transition-all ${
                        isDup
                          ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center space-x-1.5 min-w-0">
                        {student.number && (
                          <span className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[10px] ${
                            isDup ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {student.number}
                          </span>
                        )}
                        <span className="truncate">{student.name}</span>
                      </div>
                      {isDup && (
                        <span className="text-[10px] bg-amber-200 text-amber-900 px-1 py-0.5 rounded font-medium shrink-0 ml-1">
                          重複
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 1: Upload CSV */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.txt,.tsv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <Upload className="w-7 h-7" />
                </div>
                <h3 className="text-base font-semibold text-slate-800 mb-1">
                  點擊或拖曳 CSV 檔案至此處
                </h3>
                <p className="text-sm text-slate-500 mb-4 max-w-md mx-auto">
                  支援學校系統匯出的 CSV、Excel 轉存 CSV、TXT 純文字。系統會自動辨別「姓名」與「座號」欄位，並自動檢測重複名單。
                </p>
                <span className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white text-indigo-700 border border-indigo-200 shadow-xs">
                  選擇檔案 (.csv, .txt)
                </span>
              </div>

              {/* Quick Guidance to Simulation */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>想先了解網頁效果？使用「模擬名單」</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    提供標準30人班級、12人小組專題、雙語班等範例，無須上傳即可直接測試。
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('sample')}
                  className="px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                >
                  前往挑選模擬名單
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Paste Students */}
          {activeTab === 'paste' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  貼上或輸入學生姓名：
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  每行一位學生，或者用逗號、頓號、空格隔開皆可。（例如：陳冠宇、林子涵、黃俊傑）
                </p>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  rows={8}
                  placeholder={`陳冠宇\n林子涵\n黃俊傑\n張雅晴\n李承翰`}
                  className="w-full p-3.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-xs text-slate-500">
                  {pastedText.trim() ? `已偵測約 ${pastedText.split(/[\r\n,;、\t]+/).filter(Boolean).length} 個姓名` : '尚未輸入內容'}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPastedText('')}
                    disabled={!pastedText.trim()}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-40 cursor-pointer"
                  >
                    清除重填
                  </button>
                  <button
                    onClick={handlePreviewPasted}
                    disabled={!pastedText.trim()}
                    className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    預覽並檢查名單
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Simulation Mock Classes */}
          {activeTab === 'sample' && (
            <div className="space-y-5">
              <div className="bg-gradient-to-r from-amber-50 to-indigo-50 p-4 rounded-xl border border-amber-200/80">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm mb-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>模擬名單中心（快速上手與功能示範）</span>
                </div>
                <p className="text-xs text-slate-600">
                  這裏為老師準備了不同教學場景的模擬名單。選擇任一組合點擊「載入此名單」，即可快速體會「隨機抽籤」動畫音效以及「自動分組」功能！
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {SAMPLE_CLASSES.map((sample) => (
                  <div
                    key={sample.id}
                    className="flex flex-col justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-xs transition-all"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {sample.badge}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 mb-1">{sample.title}</h4>
                      <p className="text-xs text-slate-500 mb-3">{sample.description}</p>
                    </div>

                    <button
                      onClick={() => handleLoadSampleClass(sample.id)}
                      className="w-full mt-2 py-2 px-3 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      載入此名單測試
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Current Roster Management */}
          {activeTab === 'manage' && (
            <div className="space-y-5">
              
              {/* Duplicate Banner in Current List */}
              {currentDuplicatesList.length > 0 && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start sm:items-center gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
                    <div>
                      <h5 className="text-xs font-bold text-amber-900">
                        名單中含有 {currentDuplicatesList.length} 個重複姓名
                      </h5>
                      <p className="text-[11px] text-amber-800 mt-0.5">
                        重複姓名已在下方標記。您可以點擊右側按鈕一次性清除多餘的重複項目，僅保留一位。
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveCurrentDuplicates}
                    className="px-3.5 py-1.5 text-xs font-bold text-amber-900 bg-amber-200/80 hover:bg-amber-200 border border-amber-300 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-800" />
                    一鍵移除重複姓名
                  </button>
                </div>
              )}

              {/* Quick Add Form */}
              <form onSubmit={handleAddSingleStudent} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex flex-wrap sm:flex-nowrap gap-2 items-center">
                <div className="w-24 shrink-0">
                  <input
                    type="text"
                    placeholder="座號 (選填)"
                    value={newStudentNumber}
                    onChange={(e) => setNewStudentNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex-1 min-w-[140px]">
                  <input
                    type="text"
                    placeholder="手動新增學生姓名..."
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!newStudentName.trim()}
                  className="px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg transition-colors flex items-center gap-1 shrink-0 shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  新增
                </button>
              </form>

              {/* Roster Controls & Search */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="搜尋學生姓名或座號..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  {students.length > 0 && (
                    <>
                      {currentDuplicatesList.length > 0 && (
                        <button
                          onClick={handleRemoveCurrentDuplicates}
                          className="px-3 py-1.5 text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                          title="一次性清除重複姓名"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                          移除重複項 ({currentDuplicatesList.length})
                        </button>
                      )}
                      <button
                        onClick={handleExportCSV}
                        className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        匯出 CSV
                      </button>
                      <button
                        onClick={handleClearAll}
                        className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        清空名單
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Students Grid */}
              {students.length === 0 ? (
                <div className="text-center py-12 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium">目前名單是空的</p>
                  <p className="text-xs text-slate-400 mt-1">請切換到「上傳 CSV」、「貼上名單」或「模擬名單」新增學生</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredStudents.map((student) => {
                    const isDup = (duplicateNameCountMap.get(student.name.trim()) || 0) > 1;
                    return (
                      <div
                        key={student.id}
                        className={`group flex items-center justify-between p-2.5 rounded-lg border transition-all text-left ${
                          isDup 
                            ? 'bg-amber-50/80 border-amber-300 hover:border-amber-400' 
                            : 'bg-slate-50 hover:bg-indigo-50/50 border-slate-200 hover:border-indigo-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          {student.number && (
                            <span className={`w-6 h-6 shrink-0 rounded-full text-xs flex items-center justify-center font-bold ${
                              isDup 
                                ? 'bg-amber-200 text-amber-900' 
                                : 'bg-slate-200 group-hover:bg-indigo-200 text-slate-700 group-hover:text-indigo-800'
                            }`}>
                              {student.number}
                            </span>
                          )}
                          <span className={`font-semibold text-sm truncate ${
                            isDup ? 'text-amber-950 font-bold' : 'text-slate-800'
                          }`}>
                            {student.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          {isDup && (
                            <span className="text-[10px] bg-amber-200 text-amber-900 px-1 py-0.5 rounded font-medium shrink-0">
                              重複
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteStudent(student.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded transition-opacity cursor-pointer"
                            title="移除此學生"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            名單會自動保存在您的瀏覽器中，重新整理不會消失。
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors shadow-xs cursor-pointer"
          >
            完成設定
          </button>
        </div>

      </div>
    </div>
  );
};
