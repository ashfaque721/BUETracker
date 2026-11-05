import type { Course, CourseType } from '../types';
import { matchBuetCourse } from './buetCatalog';

export interface ParsedBIISCourse {
  code: string;
  title: string;
  credits: number;
  grade: string;
  gradePoint: number;
  type: CourseType;
}

export interface BIISParseResult {
  success: boolean;
  courses: ParsedBIISCourse[];
  termGpa?: number;
  totalCredits?: number;
  rawCount: number;
  errors: string[];
}

const GRADE_POINT_MAP: Record<string, number> = {
  'A+': 4.00,
  'A': 3.75,
  'A-': 3.50,
  'B+': 3.25,
  'B': 3.00,
  'B-': 2.75,
  'C+': 2.50,
  'C': 2.25,
  'D': 2.00,
  'F': 0.00,
  'S': 4.00,
  'X': 0.00,
};

const GP_TO_GRADE_MAP: Record<number, string> = {
  4.00: 'A+',
  3.75: 'A',
  3.50: 'A-',
  3.25: 'B+',
  3.00: 'B',
  2.75: 'B-',
  2.50: 'C+',
  2.25: 'C',
  2.00: 'D',
  0.00: 'F',
};

// Course code pattern: 2 to 5 letters followed by optional space and 3 to 4 digits (anywhere on line)
const COURSE_CODE_REGEX = /\b([A-Z]{2,5})\s*[-_]?\s*(\d{3,4})\b/i;

const BUET_DEPT_PREFIXES = [
  'CHEM', 'PHY', 'MATH', 'HUM', 'ME', 'IPE', 'EEE', 'CSE', 'CE', 'ChE', 'BME', 'NAME', 'MME', 'URP', 'WRE', 'ARCH', 'SHOP'
];

const STANDARD_CREDITS = [0.75, 1.50, 2.00, 3.00, 4.00, 6.00];

export function snapCredit(val: number): number {
  if (isNaN(val) || val <= 0) return 3.0;
  let closest = STANDARD_CREDITS[0];
  let minDiff = Math.abs(val - closest);
  for (const c of STANDARD_CREDITS) {
    const diff = Math.abs(val - c);
    if (diff < minDiff) {
      minDiff = diff;
      closest = c;
    }
  }
  return closest;
}

export function snapGradePoint(val: number): number {
  const gps = [4.00, 3.75, 3.50, 3.25, 3.00, 2.75, 2.50, 2.25, 2.00, 0.00];
  let closest = gps[0];
  let minDiff = Math.abs(val - closest);
  for (const g of gps) {
    const diff = Math.abs(val - g);
    if (diff < minDiff) {
      minDiff = diff;
      closest = g;
    }
  }
  return closest;
}

export function cleanOcrArtifacts(line: string): string {
  return line
    .replace(/[\|\[\]\{\}]/g, ' ')
    // Fix comma in decimals like 3,00 or 4,20
    .replace(/(\d),(\d{2})/g, '$1.$2')
    // Fix common OCR dept typos
    .replace(/\bCH[z3]M\b/gi, 'CHEM')
    .replace(/\b[F~]UM\b/gi, 'HUM')
    .replace(/\bFUR\b/gi, 'HUM')
    .replace(/\bHJM\b/gi, 'HUM')
    .replace(/\b\*ATH\b/gi, 'MATH')
    .replace(/\bMTH\b/gi, 'MATH')
    .replace(/\bSLY\b/gi, 'PHY')
    .replace(/\bSHP\b/gi, 'SHOP')
    // Fix OCR typos in grade symbols
    .replace(/\bA\s*[\+\=\~]\b/gi, 'A+')
    .replace(/\bB\s*[\+\=\~]\b/gi, 'B+')
    .replace(/\bC\s*[\+\=\~]\b/gi, 'C+')
    .replace(/\b[28]\s*[\+\=\~]\b/gi, 'B+')
    .replace(/\b[238]\s*[\-]\b/gi, 'B-')
    .replace(/\bA\s*-\b/gi, 'A-')
    .replace(/\bB\s*-\b/gi, 'B-')
    .replace(/\bC\s*-\b/gi, 'C-')
    .replace(/\bE\+\b/gi, 'B+')
    // Fix course numbers with letter O/C like 1C5 -> 105, 1O5 -> 105, 1C2 -> 102
    .replace(/\b([1-4])[OCoc](\d)\b/g, '$10$2')
    .replace(/\b([0-4])\.[O0][O0]\b/gi, '$1.00')
    .replace(/\b[O0]\.75\b/gi, '0.75')
    .replace(/\b1\.[S5]0?\b/gi, '1.50')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function parseBIISText(text: string): BIISParseResult {
  if (!text || !text.trim()) {
    return { success: false, courses: [], rawCount: 0, errors: ['Empty input text'] };
  }

  // Check for explicit GPA line e.g. "GPA: 3.59"
  let sheetGpa: number | undefined = undefined;
  const gpaMatch = text.match(/(?:CGPA|GPA)[:\s]+([0-4]\.\d{2})/i);
  if (gpaMatch) {
    sheetGpa = parseFloat(gpaMatch[1]);
  }

  const rawLines = text
    .split(/\r?\n/)
    .map((l) => cleanOcrArtifacts(l))
    .filter(Boolean);

  const courses: ParsedBIISCourse[] = [];
  const errors: string[] = [];

  // Identify where each course block starts
  const courseStartIndices: number[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const lower = line.toLowerCase();

    // Skip headers or administrative lines
    if (
      lower.includes('course no') ||
      lower.includes('course code') ||
      lower.includes('course title') ||
      lower.includes('credit hour') ||
      lower.includes('grade sheet') ||
      lower.includes('bangladesh university') ||
      lower.includes('student id') ||
      lower.includes('term examination') ||
      lower.includes('credit earned') ||
      lower.includes('total credits earned') ||
      lower.includes('satisfactory')
    ) {
      continue;
    }

    if (COURSE_CODE_REGEX.test(line)) {
      courseStartIndices.push(i);
    }
  }

  if (courseStartIndices.length > 0) {
    // Process each multi-line or single-line course block
    for (let b = 0; b < courseStartIndices.length; b++) {
      const startIdx = courseStartIndices[b];
      const endIdx = b + 1 < courseStartIndices.length ? courseStartIndices[b + 1] : rawLines.length;
      const blockLines = rawLines.slice(startIdx, endIdx);
      const firstLine = blockLines[0];

      const codeMatch = firstLine.match(COURSE_CODE_REGEX);
      if (!codeMatch) continue;

      const deptPrefix = codeMatch[1].toUpperCase();
      const courseDigits = codeMatch[2];
      let fullCode = `${deptPrefix} ${courseDigits}`;
      const courseNum = parseInt(courseDigits, 10);

      const codePos = firstLine.indexOf(codeMatch[0]);
      let titlePart = firstLine.substring(codePos + codeMatch[0].length).trim();

      // Look across all lines in this block for credits, grade, and grade point
      const restLines = blockLines.slice(1);
      const allTokens = restLines.flatMap((l) => l.split(/\s+/).filter(Boolean));

      let credits: number | undefined = undefined;
      let grade: string | undefined = undefined;
      let gradePoint: number | undefined = undefined;

      // 1. Scan subsequent tokens in multi-line paste
      for (const tok of allTokens) {
        // Standard BUET credit
        if (/^(0\.75|1\.50?|2\.00?|3\.00?|4\.00?|6\.00?)$/.test(tok)) {
          if (credits === undefined) {
            credits = snapCredit(parseFloat(tok));
            continue;
          }
        }
        // BUET Letter Grade
        if (/^(A\+|A-|A|B\+|B-|B|C\+|C|D|F|S|X)$/i.test(tok)) {
          if (grade === undefined) {
            grade = tok.toUpperCase();
            continue;
          }
        }
        // Grade Point decimal
        if (/^[0-4]\.\d{1,2}$/.test(tok)) {
          const val = parseFloat(tok);
          if (gradePoint === undefined && (GRADE_POINT_MAP[GP_TO_GRADE_MAP[val]] !== undefined || val === 0)) {
            gradePoint = snapGradePoint(val);
          } else if (credits === undefined && (val === 0.75 || val === 1.5 || val === 2.0 || val === 3.0 || val === 4.0)) {
            credits = snapCredit(val);
          }
        }
      }

      // 2. Fallback to scanning the first line for single-line format
      if (credits === undefined || grade === undefined || gradePoint === undefined) {
        const lineTokens = titlePart.split(/\s+/).filter(Boolean);
        if (lineTokens.length >= 3) {
          const last = lineTokens[lineTokens.length - 1];
          const secondLast = lineTokens[lineTokens.length - 2]?.toUpperCase();
          const thirdLast = lineTokens[lineTokens.length - 3];

          if (gradePoint === undefined && /^[0-4]\.\d{1,2}$/.test(last)) {
            gradePoint = snapGradePoint(parseFloat(last));
          }
          if (grade === undefined && GRADE_POINT_MAP[secondLast] !== undefined) {
            grade = secondLast;
          }
          if (credits === undefined && !isNaN(parseFloat(thirdLast))) {
            credits = snapCredit(parseFloat(thirdLast));
          }

          if (gradePoint !== undefined && grade !== undefined && credits !== undefined) {
            titlePart = lineTokens.slice(0, lineTokens.length - 3).join(' ');
          }
        }
      }

      // Deduce missing grade or gradePoint
      if (gradePoint !== undefined && grade === undefined) {
        grade = GP_TO_GRADE_MAP[gradePoint] || 'A+';
      }
      if (grade !== undefined && gradePoint === undefined) {
        gradePoint = GRADE_POINT_MAP[grade] ?? 4.00;
      }

      // Collect any title words from subsequent lines (excluding numbers/grades)
      const nonNumericWords: string[] = [];
      for (const rLine of restLines) {
        const cleaned = rLine
          .replace(/\b(0\.75|1\.50?|2\.00?|3\.00?|4\.00?|6\.00?)\b/g, '')
          .replace(/\b(A\+|A-|A|B\+|B-|B|C\+|C|D|F|S|X)\b/gi, '')
          .replace(/\b[0-4]\.\d{1,2}\b/g, '')
          .replace(/[\|\-\:\+\=\*\_\/\[\]]/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
        if (cleaned.length > 2 && !/^\d+$/.test(cleaned)) {
          nonNumericWords.push(cleaned);
        }
      }

      let title = (titlePart + ' ' + nonNumericWords.join(' ')).trim();
      title = title
        .replace(/\b(0\.75|1\.50?|2\.00?|3\.00?|4\.00?|6\.00?)\b/g, '')
        .replace(/\b(A\+|A-|A|B\+|B-|B|C\+|C|D|F|S|X)\b/gi, '')
        .replace(/\b[0-4]\.\d{1,2}\b/g, '')
        .replace(/[\|\:\+\=\*\_\/\[\]]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      const finalCredits = credits ?? (courseNum % 2 === 0 ? 1.5 : 3.0);
      const finalGrade = grade ?? 'A+';
      const finalGradePoint = gradePoint ?? (GRADE_POINT_MAP[finalGrade] ?? 4.00);

      const catalogMatch = matchBuetCourse(fullCode, title);
      // Strictly preserve cleanly parsed course codes (e.g. CHEM 143) and titles from actual BIIS sheet
      const finalCode = fullCode && COURSE_CODE_REGEX.test(fullCode) ? fullCode : catalogMatch?.code || fullCode;
      const finalTitle = title && title.length >= 3 && !title.startsWith('Course ') ? title : catalogMatch?.title || `Course ${finalCode}`;

      const isSessional =
        catalogMatch?.type === 'sessional' ||
        finalCredits <= 1.5 ||
        courseNum % 2 === 0 ||
        /lab|sessional|drawing|shop|practice/i.test(finalTitle);

      courses.push({
        code: finalCode,
        title: finalTitle,
        credits: finalCredits,
        grade: finalGrade,
        gradePoint: finalGradePoint,
        type: isSessional ? 'sessional' : 'theory',
      });
    }
  } else {
    // Fallback: Line-by-line fallback parser for non-standard formats
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const codeMatch = line.match(COURSE_CODE_REGEX);
      if (!codeMatch) continue;

      const fullCode = `${codeMatch[1].toUpperCase()} ${codeMatch[2]}`;
      const courseNum = parseInt(codeMatch[2], 10);
      const codeIndex = line.indexOf(codeMatch[0]);
      const afterCode = line.substring(codeIndex + codeMatch[0].length).trim();

      let credits = courseNum % 2 === 0 ? 1.5 : 3.0;
      let grade = 'A+';
      let gradePoint = 4.00;
      let title = afterCode;

      const crMatch = afterCode.match(/\b(0\.75|1\.50?|2\.00?|3\.00?|4\.00?|6\.00?)\b/);
      if (crMatch) credits = snapCredit(parseFloat(crMatch[0]));

      const grMatch = afterCode.match(/\b(A\+|A-|A|B\+|B-|B|C\+|C|D|F|S|X)\b/i);
      if (grMatch) grade = grMatch[1].toUpperCase();

      const gpMatch = afterCode.match(/\b([0-4]\.\d{1,2})\b/);
      if (gpMatch) gradePoint = snapGradePoint(parseFloat(gpMatch[0]));
      else if (GRADE_POINT_MAP[grade] !== undefined) gradePoint = GRADE_POINT_MAP[grade];

      title = title
        .replace(/\b(0\.75|1\.50?|2\.00?|3\.00?|4\.00?|6\.00?)\b/g, '')
        .replace(/\b(A\+|A-|A|B\+|B-|B|C\+|C|D|F|S|X)\b/gi, '')
        .replace(/\b[0-4]\.\d{1,2}\b/g, '')
        .replace(/[\|\-\:\+\=\*\_\/\[\]]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

      const catalogMatch = matchBuetCourse(fullCode, title);
      courses.push({
        code: catalogMatch?.code || fullCode,
        title: catalogMatch?.title || title || `Course ${fullCode}`,
        credits: catalogMatch?.credits ?? credits,
        grade,
        gradePoint,
        type: courseNum % 2 === 0 || /lab|sessional|drawing|shop|practice/i.test(title) ? 'sessional' : 'theory',
      });
    }
  }

  let totalPoints = 0;
  let totalCredits = 0;
  courses.forEach((c) => {
    totalCredits += c.credits;
    totalPoints += c.credits * c.gradePoint;
  });

  const calculatedGpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : undefined;
  const termGpa = sheetGpa ?? calculatedGpa;

  return {
    success: courses.length > 0,
    courses,
    termGpa,
    totalCredits: Number(totalCredits.toFixed(2)),
    rawCount: courses.length,
    errors,
  };
}

export function convertParsedCourseToAppCourse(
  parsed: ParsedBIISCourse,
  semesterId: string,
  isOngoing = false
): Course {
  return {
    id: `course_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code: parsed.code,
    title: parsed.title,
    nickname: parsed.title.split(' ')[0] || parsed.code,
    credits: parsed.credits,
    type: parsed.type,
    semesterId,
    color: '#0284c7',
    isOngoing,
    grade: isOngoing ? undefined : parsed.grade,
    gradePoint: isOngoing ? undefined : parsed.gradePoint,
    projectedGradePoint: isOngoing && parsed.type === 'sessional' ? 4.0 : undefined,
    attendance: isOngoing && parsed.type === 'theory' ? { totalConducted: 0, attended: 0 } : undefined,
    classTests: isOngoing && parsed.type === 'theory' ? [] : undefined,
  };
}
