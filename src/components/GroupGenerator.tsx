import React, { useState, useId } from 'react';
import { 
  Users, 
  Shuffle, 
  Crown, 
  Copy, 
  Check, 
  Download, 
  Sparkles, 
  AlertCircle,
  MoveRight,
  UserCheck,
  Edit2
} from 'lucide-react';
import { Student, Group, GroupConfig, GroupMode } from '../types';
import { GROUP_THEMES } from '../utils/groupThemes';
import { soundManager } from '../utils/audio';

interface GroupGeneratorProps {
  students: Student[];
  onOpenStudentManager: () => void;
}

export const GroupGenerator: React.FC<GroupGeneratorProps> = ({
  students,
  onOpenStudentManager,
}) => {
  const groupSizeModeId = useId();
  const groupCountModeId = useId();
  // Group settings
  const [config, setConfig] = useState<GroupConfig>({
    mode: 'by-size', // 'by-size' (每組幾人) | 'by-count' (分成幾組)
    groupSize: 4,
    groupCount: 4,
    assignLeader: true,
    balanceRemainder: true,
  });

  // Generated groups
  const [groups, setGroups] = useState<Group[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');

  // Transfer student between groups modal/popover state
  const [selectedStudentToMove, setSelectedStudentToMove] = useState<{
    student: Student;
    fromGroupId: string;
  } | null>(null);

  // Helper to shuffle students (Fisher-Yates)
  const shuffleStudents = (array: Student[]): Student[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Generate Groups Logic
  const handleGenerateGroups = () => {
    if (students.length === 0) return;

    setIsShuffling(true);
    soundManager.playClick();

    setTimeout(() => {
      const shuffledStudents = shuffleStudents(students);
      const total = shuffledStudents.length;

      let numGroups = 1;

      if (config.mode === 'by-size') {
        const size = Math.max(1, Math.min(config.groupSize, total));
        if (config.balanceRemainder) {
          numGroups = Math.max(1, Math.round(total / size));
        } else {
          numGroups = Math.ceil(total / size);
        }
      } else {
        numGroups = Math.max(1, Math.min(config.groupCount, total));
      }

      // Initialize empty groups
      const newGroups: Group[] = Array.from({ length: numGroups }, (_, i) => {
        const theme = GROUP_THEMES[i % GROUP_THEMES.length];
        return {
          id: `group-${i + 1}`,
          name: `第 ${i + 1} 組`,
          members: [],
          colorTheme: theme,
        };
      });

      // Distribute students round-robin to ensure balanced group sizes
      shuffledStudents.forEach((student, index) => {
        const groupIndex = index % numGroups;
        newGroups[groupIndex].members.push(student);
      });

      // Assign leaders if enabled
      if (config.assignLeader) {
        newGroups.forEach(group => {
          if (group.members.length > 0) {
            const randomLeaderIndex = Math.floor(Math.random() * group.members.length);
            group.leaderId = group.members[randomLeaderIndex].id;
          }
        });
      }

      setGroups(newGroups);
      setIsShuffling(false);
      soundManager.playGroupCompleteSound();
    }, 450);
  };

  // Toggle leader
  const handleSetLeader = (groupId: string, studentId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          leaderId: g.leaderId === studentId ? undefined : studentId,
        };
      }
      return g;
    }));
    soundManager.playClick();
  };

  // Rename group
  const handleSaveGroupName = (groupId: string) => {
    if (!editingGroupName.trim()) {
      setEditingGroupId(null);
      return;
    }
    setGroups(prev => prev.map(g => 
      g.id === groupId ? { ...g, name: editingGroupName.trim() } : g
    ));
    setEditingGroupId(null);
  };

  // Move student to another group
  const handleMoveStudent = (targetGroupId: string) => {
    if (!selectedStudentToMove || selectedStudentToMove.fromGroupId === targetGroupId) {
      setSelectedStudentToMove(null);
      return;
    }

    setGroups(prev => {
      const { student, fromGroupId } = selectedStudentToMove;
      return prev.map(g => {
        if (g.id === fromGroupId) {
          const remaining = g.members.filter(m => m.id !== student.id);
          const newLeader = g.leaderId === student.id ? remaining[0]?.id : g.leaderId;
          return { ...g, members: remaining, leaderId: newLeader };
        }
        if (g.id === targetGroupId) {
          return { ...g, members: [...g.members, student] };
        }
        return g;
      });
    });

    setSelectedStudentToMove(null);
    soundManager.playClick();
  };

  // Copy plain text grouping results
  const handleCopyResults = () => {
    if (groups.length === 0) return;

    const lines: string[] = [`【課堂隨機分組名單】共 ${groups.length} 組 / ${students.length} 位學生\n`];
    groups.forEach(g => {
      const leader = g.members.find(m => m.id === g.leaderId);
      const membersText = g.members
        .map(m => `${m.name}${m.id === g.leaderId ? '(組長👑)' : ''}`)
        .join('、 ');
      lines.push(`${g.name} (${g.members.length}人): ${membersText}`);
    });

    navigator.clipboard.writeText(lines.join('\n'));
    setCopied(true);
    soundManager.playClick();
    setTimeout(() => setCopied(false), 2500);
  };

  // Export grouping as CSV
  const handleExportCSV = () => {
    if (groups.length === 0) return;

    const rows: string[] = ['組別,姓名,座號,是否為組長'];
    groups.forEach(g => {
      g.members.forEach(m => {
        const isLeader = m.id === g.leaderId ? '是' : '否';
        rows.push(`"${g.name}","${m.name}","${m.number || ''}","${isLeader}"`);
      });
    });

    const csvContent = '\uFEFF' + rows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `分組結果_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (students.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">尚未載入學生名單</h2>
        <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
          請先上傳 CSV 或貼上學生姓名名單，系統才能為您進行隨機自動分組。
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

  // Calculate preview group count
  const previewGroups = config.mode === 'by-size' 
    ? Math.max(1, Math.round(students.length / Math.max(1, config.groupSize)))
    : config.groupCount;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">

      {/* Configuration Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              自動分組參數設定
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              班級現有 <strong className="text-indigo-600 font-bold">{students.length}</strong> 位學生，可依需求選擇「每組幾人」或「分成幾組」
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">預計分為:</span>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100">
              約 {previewGroups} 組 (平均每組約 {Math.round(students.length / previewGroups)} 人)
            </span>
          </div>
        </div>

        {/* Mode Selector & Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Option 1: Mode Switch */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600">分組依據</span>
            <div className="space-y-2">
              <label className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                config.mode === 'by-size'
                  ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-semibold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}>
                <input
                  id={groupSizeModeId}
                  name="groupingMode"
                  type="radio"
                  checked={config.mode === 'by-size'}
                  onChange={() => setConfig(prev => ({ ...prev, mode: 'by-size' }))}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm">設定「每組幾個人」</span>
              </label>

              <label className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                config.mode === 'by-count'
                  ? 'border-indigo-500 bg-indigo-50/50 text-indigo-900 font-semibold'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}>
                <input
                  id={groupCountModeId}
                  name="groupingMode"
                  type="radio"
                  checked={config.mode === 'by-count'}
                  onChange={() => setConfig(prev => ({ ...prev, mode: 'by-count' }))}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm">設定「要分成幾組」</span>
              </label>
            </div>
          </div>

          {/* Option 2: Value Slider / Number Input */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600">
              {config.mode === 'by-size' ? '每組人數設定' : '組數設定'}
            </span>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {config.mode === 'by-size' ? '目標每組人數' : '目標組數'}
                </span>
                <span className="text-xl font-extrabold text-indigo-600">
                  {config.mode === 'by-size' ? `${config.groupSize} 人` : `${config.groupCount} 組`}
                </span>
              </div>

              {config.mode === 'by-size' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={2}
                    max={Math.max(2, Math.min(15, students.length))}
                    value={config.groupSize}
                    onChange={(e) => setConfig(prev => ({ ...prev, groupSize: Number(e.target.value) }))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={2}
                    max={Math.max(2, Math.min(15, Math.ceil(students.length / 2)))}
                    value={config.groupCount}
                    onChange={(e) => setConfig(prev => ({ ...prev, groupCount: Number(e.target.value) }))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              )}

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>最少 2</span>
                <span>最多 15</span>
              </div>
            </div>
          </div>

          {/* Option 3: Additional Options (Leader & Balance) */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-600">進階選項</span>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.assignLeader}
                  onChange={(e) => setConfig(prev => ({ ...prev, assignLeader: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-semibold flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5 text-amber-500" />
                  自動隨機選拔組長
                </span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.balanceRemainder}
                  onChange={(e) => setConfig(prev => ({ ...prev, balanceRemainder: e.target.checked }))}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>自動均勻分配餘數（各組人數最接近）</span>
              </label>
            </div>
          </div>

        </div>

        {/* Generate Button */}
        <div className="pt-2 flex justify-center">
          <button
            onClick={handleGenerateGroups}
            disabled={isShuffling}
            className={`px-8 py-3.5 rounded-2xl font-black text-base tracking-wider text-white shadow-lg transition-all flex items-center gap-2.5 ${
              isShuffling
                ? 'bg-indigo-400 cursor-wait'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-98 shadow-indigo-200'
            }`}
          >
            <Shuffle className={`w-5 h-5 ${isShuffling ? 'animate-spin' : ''}`} />
            <span>{groups.length > 0 ? '重新隨機分組' : '開始隨機自動分組'}</span>
          </button>
        </div>

      </div>

      {/* Visualized Results Section */}
      {groups.length > 0 && (
        <div className="space-y-4">
          
          {/* Results Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="font-extrabold text-slate-900 text-sm">
                分組結果（共 {groups.length} 組）
              </h3>
              <span className="text-xs text-slate-400">
                點擊成員可設為組長或轉移組別
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyResults}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">已複製到剪貼簿！</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>複製分組結果</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>匯出 CSV</span>
              </button>
            </div>
          </div>

          {/* Group Transfer Modal Popover */}
          {selectedStudentToMove && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs text-indigo-900">
                <span className="font-bold">調整學生所屬組別：</span>
                <span className="px-2 py-0.5 bg-white font-bold rounded-lg border border-indigo-200">
                  {selectedStudentToMove.student.name}
                </span>
                <span>移動至 ➔</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {groups.map(g => (
                  <button
                    key={g.id}
                    onClick={() => handleMoveStudent(g.id)}
                    disabled={g.id === selectedStudentToMove.fromGroupId}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                      g.id === selectedStudentToMove.fromGroupId
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-white text-indigo-700 hover:bg-indigo-600 hover:text-white border border-indigo-200 shadow-xs'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
                <button
                  onClick={() => setSelectedStudentToMove(null)}
                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* Groups Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((group) => {
              const { colorTheme } = group;
              const isEditing = editingGroupId === group.id;

              return (
                <div
                  key={group.id}
                  className={`rounded-3xl border ${colorTheme.border} ${colorTheme.bg} p-5 shadow-sm transition-all duration-200 hover:shadow-md flex flex-col justify-between`}
                >
                  {/* Group Header */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingGroupName}
                            onChange={(e) => setEditingGroupName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveGroupName(group.id)}
                            autoFocus
                            className="text-xs font-bold px-2 py-1 bg-white border border-slate-300 rounded-lg w-28"
                          />
                          <button
                            onClick={() => handleSaveGroupName(group.id)}
                            className="p-1 text-emerald-600 hover:bg-white rounded"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className={`px-3 py-1 rounded-xl text-xs font-black shadow-2xs ${colorTheme.badge}`}>
                            {group.name}
                          </span>
                          <button
                            onClick={() => {
                              setEditingGroupId(group.id);
                              setEditingGroupName(group.name);
                            }}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
                            title="修改組名"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <span className="text-xs font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded-full border border-slate-200/60">
                        {group.members.length} 人
                      </span>
                    </div>

                    {/* Member List */}
                    <div className="space-y-2 mt-3">
                      {group.members.map((member) => {
                        const isLeader = group.leaderId === member.id;
                        const isSelectedToMove = selectedStudentToMove?.student.id === member.id;

                        return (
                          <div
                            key={member.id}
                            className={`group/item flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                              isLeader
                                ? 'bg-amber-50/90 border-amber-300 shadow-xs'
                                : isSelectedToMove
                                ? 'bg-indigo-100 border-indigo-400'
                                : 'bg-white/90 hover:bg-white border-slate-200/80 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center space-x-2 min-w-0">
                              {member.number && (
                                <span className="text-[11px] font-bold text-slate-400 shrink-0">
                                  #{member.number}
                                </span>
                              )}
                              <span className="font-bold text-slate-900 text-sm truncate">
                                {member.name}
                              </span>
                              {isLeader && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-500 text-white rounded-md text-[10px] font-black shrink-0 shadow-2xs">
                                  <Crown className="w-2.5 h-2.5 fill-current" />
                                  組長
                                </span>
                              )}
                            </div>

                            {/* Actions on hover */}
                            <div className="flex items-center space-x-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <button
                                onClick={() => handleSetLeader(group.id, member.id)}
                                className={`p-1 rounded text-xs transition-colors ${
                                  isLeader
                                    ? 'text-amber-600 hover:bg-amber-100'
                                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100'
                                }`}
                                title={isLeader ? '取消組長身份' : '指派為此組組長'}
                              >
                                <Crown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setSelectedStudentToMove({ student: member, fromGroupId: group.id })}
                                className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded text-xs transition-colors"
                                title="移至其他組別"
                              >
                                <MoveRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Empty group alert */}
                  {group.members.length === 0 && (
                    <div className="text-center py-6 text-xs text-slate-400">
                      此組尚無成員
                    </div>
                  )}

                  {/* Footer small note */}
                  <div className="mt-4 pt-2 border-t border-slate-200/50 flex items-center justify-between text-[11px] text-slate-400">
                    <span>提示: 懸停可設組長/換組</span>
                    <button
                      onClick={() => {
                        const randomPick = group.members[Math.floor(Math.random() * group.members.length)];
                        if (randomPick) handleSetLeader(group.id, randomPick.id);
                      }}
                      className="text-indigo-600 hover:underline flex items-center gap-0.5"
                    >
                      <Crown className="w-2.5 h-2.5 text-amber-500" />
                      重新抽組長
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
};
