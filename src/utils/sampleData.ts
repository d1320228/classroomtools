import { Student } from '../types';

export interface SampleClass {
  id: string;
  title: string;
  description: string;
  badge: string;
  students: { name: string; number: string }[];
}

export const SAMPLE_CLASSES: SampleClass[] = [
  {
    id: 'class-standard-30',
    title: '標準班級名單（30人）',
    description: '適合一般中小學及高中完整班級進行抽籤或分組',
    badge: '30 位學生',
    students: [
      { name: '陳冠宇', number: '01' }, { name: '林子涵', number: '02' },
      { name: '黃俊傑', number: '03' }, { name: '張雅晴', number: '04' },
      { name: '李承翰', number: '05' }, { name: '王品璇', number: '06' },
      { name: '吳宗憲', number: '07' }, { name: '劉庭妤', number: '08' },
      { name: '蔡政諺', number: '09' }, { name: '楊佩珊', number: '10' },
      { name: '許家豪', number: '11' }, { name: '鄭羽彤', number: '12' },
      { name: '謝旻勳', number: '13' }, { name: '郭芳妤', number: '14' },
      { name: '曾柏翔', number: '15' }, { name: '邱郁婷', number: '16' },
      { name: '賴冠廷', number: '17' }, { name: '周映竹', number: '18' },
      { name: '廖建宏', number: '19' }, { name: '徐若瑄', number: '20' },
      { name: '何宇軒', number: '21' }, { name: '高晨翔', number: '22' },
      { name: '莊詠婷', number: '23' }, { name: '孫維倫', number: '24' },
      { name: '葉品儀', number: '25' }, { name: '彭俊彥', number: '26' },
      { name: '蘇怡君', number: '27' }, { name: '潘彥廷', number: '28' },
      { name: '盧芷萱', number: '29' }, { name: '魏子傑', number: '30' },
    ],
  },
  {
    id: 'class-seminar-12',
    title: '小組研討/專題課（12人）',
    description: '適合社團、實驗課或大學研討班進行 3-4 人快速分組',
    badge: '12 位學生',
    students: [
      { name: '江宏傑', number: '01' }, { name: '陳思羽', number: '02' },
      { name: '林昀儒', number: '03' }, { name: '鄭怡靜', number: '04' },
      { name: '莊智淵', number: '05' }, { name: '簡彤娟', number: '06' },
      { name: '高承睿', number: '07' }, { name: '黃怡樺', number: '08' },
      { name: '馮翊新', number: '09' }, { name: '李昱諄', number: '10' },
      { name: '廖振珽', number: '11' }, { name: '劉馨尹', number: '12' },
    ],
  },
  {
    id: 'class-bilingual-16',
    title: '雙語/英文課程（16人）',
    description: '包含英文中英對照姓名，適合外語課堂點名與互動',
    badge: '16 位學生',
    students: [
      { name: 'Alex 陳睿', number: '01' }, { name: 'Bella 林晴', number: '02' },
      { name: 'Chris 張翔', number: '03' }, { name: 'Daisy 黃萱', number: '04' },
      { name: 'Ethan 吳哲', number: '05' }, { name: 'Fiona 楊婷', number: '06' },
      { name: 'George 蔡豪', number: '07' }, { name: 'Hannah 許安', number: '08' },
      { name: 'Ian 郭廷', number: '09' }, { name: 'Jenny 曾涵', number: '10' },
      { name: 'Kevin 鄭宇', number: '11' }, { name: 'Lily 謝恩', number: '12' },
      { name: 'Max 潘威', number: '13' }, { name: 'Nina 葉彤', number: '14' },
      { name: 'Oscar 孫博', number: '15' }, { name: 'Penny 蘇晨', number: '16' },
    ],
  },
];

export function getSampleStudentsByClassId(classId: string): Student[] {
  const target = SAMPLE_CLASSES.find(c => c.id === classId) || SAMPLE_CLASSES[0];
  return target.students.map((s, index) => ({
    id: `student-sample-${classId}-${index + 1}-${Date.now()}`,
    name: s.name,
    number: s.number,
  }));
}
