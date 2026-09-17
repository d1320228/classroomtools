export interface Student {
  id: string;
  name: string;
  number?: string;
  group?: string;
}

export type DrawMode = 'with-replacement' | 'without-replacement';

export interface DrawHistoryItem {
  id: string;
  student: Student;
  timestamp: number;
  round: number;
}

export interface Group {
  id: string;
  name: string;
  members: Student[];
  leaderId?: string;
  colorTheme: {
    badge: string;
    bg: string;
    border: string;
    text: string;
    accent: string;
    hoverBg: string;
  };
}

export type GroupMode = 'by-size' | 'by-count';

export interface GroupConfig {
  mode: GroupMode;
  groupSize: number; // 每組幾人
  groupCount: number; // 分成幾組
  assignLeader: boolean; // 是否指定組長
  balanceRemainder: boolean; // 餘數均攤
}
