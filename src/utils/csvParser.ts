import { Student } from '../types';

export const SAMPLE_STUDENT_NAMES: string[] = [
  '陳冠宇', '林子涵', '黃俊傑', '張雅晴', '李承翰',
  '王品璇', '吳宗憲', '劉庭妤', '蔡政諺', '楊佩珊',
  '許家豪', '鄭羽彤', '謝旻勳', '郭芳妤', '曾柏翔',
  '邱郁婷', '賴冠廷', '周映竹', '廖建宏', '徐若瑄',
  '何宇軒', '高晨翔', '莊詠婷', '孫維倫', '葉品儀',
  '彭俊彥', '蘇怡君', '潘彥廷', '盧芷萱', '魏子傑'
];

export function generateSampleStudents(): Student[] {
  return SAMPLE_STUDENT_NAMES.map((name, index) => ({
    id: `student-sample-${index + 1}`,
    name,
    number: String(index + 1).padStart(2, '0'),
  }));
}

/**
 * Parses raw text input (from paste textarea) into student list.
 * Supports newlines, commas, semicolons, numbered bullets like "1. 王小明".
 */
export function parsePastedNames(text: string): Student[] {
  if (!text || !text.trim()) return [];

  // Split by line first or commas
  const lines = text
    .split(/[\r\n]+/)
    .map(line => line.trim())
    .filter(Boolean);

  const rawNames: string[] = [];

  for (const line of lines) {
    // If line has comma or semicolon or tab, split it
    if (/[,;、\t]/.test(line)) {
      const parts = line.split(/[,;、\t]+/).map(p => p.trim()).filter(Boolean);
      rawNames.push(...parts);
    } else {
      rawNames.push(line);
    }
  }

  const cleanedStudents: Student[] = [];
  let autoNumber = 1;

  for (const raw of rawNames) {
    // Clean leading numbers or bullets like "1. ", "01-", "一、"
    const cleaned = raw.replace(/^(\d+[\.\s、\-:]+|[一二三四五六七八九十]+[\.\s、\-:]+)/, '').trim();
    if (cleaned) {
      cleanedStudents.push({
        id: `student-${Date.now()}-${autoNumber}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleaned,
        number: String(autoNumber).padStart(2, '0'),
      });
      autoNumber++;
    }
  }

  return cleanedStudents;
}

/**
 * Parses CSV content into student list.
 * Intelligently detects name columns, handles headers, student numbers, quotes.
 */
export function parseCSVContent(csvText: string): Student[] {
  if (!csvText || !csvText.trim()) return [];

  // Remove BOM if present
  let cleanText = csvText;
  if (cleanText.charCodeAt(0) === 0xfeff) {
    cleanText = cleanText.slice(1);
  }

  const lines = cleanText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  // Parse lines into tokens (handling quotes)
  const rows: string[][] = lines.map(line => {
    const tokens: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        tokens.push(cur.trim().replace(/^"|"$/g, ''));
        cur = '';
      } else {
        cur += char;
      }
    }
    tokens.push(cur.trim().replace(/^"|"$/g, ''));
    return tokens;
  });

  if (rows.length === 0) return [];

  // Inspect first row for headers
  const firstRow = rows[0];
  let headerRowIndex = -1;
  let nameColIndex = 0;
  let numberColIndex = -1;

  // Header detection keywords
  const nameKeywords = ['姓名', '學生姓名', '名字', 'name', 'student', 'student name'];
  const numberKeywords = ['座號', '號碼', '學號', '編號', 'no', 'number', 'id', 'seat'];

  const foundNameIndex = firstRow.findIndex(cell => 
    nameKeywords.some(kw => cell.toLowerCase().includes(kw))
  );
  const foundNumberIndex = firstRow.findIndex(cell => 
    numberKeywords.some(kw => cell.toLowerCase().includes(kw))
  );

  if (foundNameIndex !== -1) {
    headerRowIndex = 0;
    nameColIndex = foundNameIndex;
    if (foundNumberIndex !== -1) {
      numberColIndex = foundNumberIndex;
    }
  } else if (firstRow.length >= 2) {
    // Check if col 0 is purely numeric (e.g. seat number) and col 1 has Chinese or text
    const col0IsNum = /^\d+$/.test(firstRow[0]);
    if (col0IsNum) {
      numberColIndex = 0;
      nameColIndex = 1;
    }
  }

  const dataRows = headerRowIndex >= 0 ? rows.slice(headerRowIndex + 1) : rows;
  const students: Student[] = [];

  dataRows.forEach((row, idx) => {
    const nameVal = row[nameColIndex]?.trim();
    if (!nameVal) return;

    let numVal = numberColIndex >= 0 && row[numberColIndex] ? row[numberColIndex].trim() : '';
    if (!numVal) {
      numVal = String(idx + 1).padStart(2, '0');
    }

    students.push({
      id: `student-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
      name: nameVal,
      number: numVal,
    });
  });

  return students;
}
