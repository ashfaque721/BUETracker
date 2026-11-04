import type { Course, CourseType } from '../types';

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

// Course code pattern: 2 to 5 letters followed by optional space and 3 to 4 digits (anywhere on line)
const COURSE_CODE_REGEX = /\b([A-Z]{2,5})\s*[-_]?\s*(\d{3,4})\b/i;

const BUET_DEPT_PREFIXES = [
  'CHEM', 'PHY', 'MATH', 'HUM', 'ME', 'IPE', 'EEE', 'CSE', 'CE', 'ChE', 'BME', 'NAME', 'MME', 'URP', 'WRE', 'ARCH', 'SHOP'
];

const BUET_TITLE_MAP = [
  { match: /inorganic|quantitative|chemistry/i, dept: 'CHEM' },
  { match: /english|language|sociology|economics|society/i, dept: 'HUM' },
  { match: /calculus|differential|integral|linear|algebra|statistics/i, dept: 'MATH' },
  { match: /cost|management|accounting|production|industrial/i, dept: 'IPE' },
  { match: /drawing|machine tools|mechanics|thermal/i, dept: 'ME' },
  { match: /physics|matter|optics|magnetism|electricity/i, dept: 'PHY' },
  { match: /shop|foundry|welding/i, dept: 'SHOP' },
  { match: /circuit|electronics|electrical|signals/i, dept: 'EEE' },
  { match: /programming|computer|algorithm|data structure/i, dept: 'CSE' },
  { match: /civil|surveying|structural|concrete/i, dept: 'CE' },
];

const STANDARD_CREDITS = [0.75, 1.50, 2.00, 3.00, 4.00, 6.00];

function snapCredit(val: number): number {
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

function snapGradePoint(val: number): number {
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
    // Fix OCR typos in grade symbols
    .replace(/\bA\s*[\+\=\~]\b/gi, 'A+')
    .replace(/\bB\s*[\+\=\~]\b/gi, 'B+')
    .replace(/\bC\s*[\+\=\~]\b/gi, 'C+')
    .replace(/\b[28]\s*[\+\=\~]\b/gi, 'B+')
    .replace(/\b[38]\s*[\-]\b/gi, 'B-')
    .replace(/\bA\s*-\b/gi, 'A-')
    .replace(/\bB\s*-\b/gi, 'B-')
    .replace(/\bC\s*-\b/gi, 'C-')
    // Fix course numbers with letter O/C like 1C5 -> 105, 1O5 -> 105
    .replace(/\b([1-4])[OCoc](\d)\b/g, '$10$2')
    .replace(/\b([0-4])\.[O0][O0]\b/gi, '$1.00')
    .replace(/\b[O0]\.75\b/gi, '0.75')
    .replace(/\b1\.[S5]0?\b/gi, '1.50')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function parseBIISText(text: string): BIISParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => cleanOcrArtifacts(l))
    .filter(Boolean);
  const courses: ParsedBIISCourse[] = [];
  const errors: string[] = [];
  let sheetGpa: number | undefined = undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for explicit GPA line e.g. "GPA: 3.59"
    const gpaMatch = line.match(/GPA[:\s]+([0-4]\.\d{2})/i);
    if (gpaMatch) {
      sheetGpa = parseFloat(gpaMatch[1]);
      continue;
    }

    // Skip headers or administrative lines
    const lower = line.toLowerCase();
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

    // Try finding course code standard match
    const codeMatch = line.match(COURSE_CODE_REGEX);
    let fullCode = '';
    let courseNum = 0;
    let afterCode = '';

    if (codeMatch) {
      fullCode = `${codeMatch[1].toUpperCase()} ${codeMatch[2]}`;
      courseNum = parseInt(codeMatch[2], 10);
      const codeIndex = line.indexOf(codeMatch[0]);
      afterCode = line.substring(codeIndex + codeMatch[0].length).trim();
    } else {
      // Fallback: search for course number (3 to 4 digits starting with 1-4)
      const numMatch = line.match(/\b([1-4]\d{2,3})\b/);
      if (!numMatch) continue;

      courseNum = parseInt(numMatch[1], 10);
      const numIdx = line.indexOf(numMatch[0]);
      let rawPrefix = line.substring(0, numIdx).replace(/[^A-Za-z]/g, '').toUpperCase();
      afterCode = line.substring(numIdx + numMatch[0].length).trim();

      // Resolve department from known prefixes or title keywords
      let resolvedDept = BUET_DEPT_PREFIXES.find((d) => d === rawPrefix);
      if (!resolvedDept) {
        for (const rule of BUET_TITLE_MAP) {
          if (rule.match.test(afterCode)) {
            resolvedDept = rule.dept;
            break;
          }
        }
      }

      if (!resolvedDept) resolvedDept = rawPrefix || 'COURSE';
      fullCode = `${resolvedDept} ${courseNum}`;
    }

    let credits = 3.0;
    let grade = 'A+';
    let gradePoint = 4.00;
    let title = '';

    // Approach 1: Check token sequence at end of line: [Title...] [Credit] [Grade] [GradePoint]
    const tokens = afterCode.split(/\s+/).filter(Boolean);
    let matchedBackwards = false;

    if (tokens.length >= 3) {
      const lastToken = tokens[tokens.length - 1];
      const secondLastToken = tokens[tokens.length - 2]?.toUpperCase();
      const thirdLastToken = tokens[tokens.length - 3];

      const parsedLastGp = parseFloat(lastToken);
      const isValidGrade = secondLastToken && GRADE_POINT_MAP[secondLastToken] !== undefined;
      const parsedThirdCredit = parseFloat(thirdLastToken);

      if (!isNaN(parsedLastGp) && isValidGrade && !isNaN(parsedThirdCredit)) {
        gradePoint = snapGradePoint(parsedLastGp);
        grade = secondLastToken;
        credits = snapCredit(parsedThirdCredit);
        title = tokens.slice(0, tokens.length - 3).join(' ').trim();
        matchedBackwards = true;
      }
    }

    // Approach 2: Fallback search if table tokens are scattered or OCR noisy
    if (!matchedBackwards) {
      // Find Grade Point (e.g. 3.75, 4.00, etc.)
      const gpMatches = [...afterCode.matchAll(/\b([0-4]\.\d{1,2})\b/g)];
      if (gpMatches.length > 0) {
        const lastGp = parseFloat(gpMatches[gpMatches.length - 1][1]);
        gradePoint = snapGradePoint(lastGp);
        grade = GP_TO_GRADE_MAP[gradePoint] || 'A+';

        if (gpMatches.length >= 2) {
          credits = snapCredit(parseFloat(gpMatches[gpMatches.length - 2][1]));
          const crIdx = afterCode.indexOf(gpMatches[gpMatches.length - 2][1]);
          if (crIdx > 0) title = afterCode.substring(0, crIdx).trim();
        } else {
          const crMatch = afterCode.match(/\b(0\.75|1\.50?|2\.00?|3\.00?|4\.00?|6\.00?)\b/);
          if (crMatch) {
            credits = snapCredit(parseFloat(crMatch[0]));
            const crIdx = afterCode.indexOf(crMatch[0]);
            if (crIdx > 0) title = afterCode.substring(0, crIdx).trim();
          }
        }
      }

      // Check explicit grade match if still unconfirmed
      const grMatch = afterCode.match(/(?:^|\s)(A\+|A-|A|B\+|B-|B|C\+|C|D|F|S|X)(?=\s|$)/);
      if (grMatch) {
        grade = grMatch[1];
        gradePoint = GRADE_POINT_MAP[grade] ?? gradePoint;
      }

      if (!title) {
        title = afterCode
          .replace(new RegExp(`\\b${credits.toFixed(2)}|${credits.toFixed(1)}|${credits}\\b`, 'g'), '')
          .replace(new RegExp(`\\b${grade}\\b`, 'g'), '')
          .replace(new RegExp(`\\b${gradePoint.toFixed(2)}|${gradePoint.toFixed(1)}\\b`, 'g'), '')
          .replace(/[\|\-\:\+\=\*\_\/\[\]]/g, ' ')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }
    }

    // Clean title string
    title = title
      .replace(/[\|\-\:\+\=\*\_\/\[\]]/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!title || title.length < 2) {
      title = `Course ${fullCode}`;
    }

    // Sessional classification in BUET (<=1.5 cr, even course number, or lab/sessional/shop keywords)
    const isSessional = credits <= 1.5 || courseNum % 2 === 0 || /lab|sessional|drawing|shop|practice/i.test(title);
    const type: CourseType = isSessional ? 'sessional' : 'theory';

    courses.push({
      code: fullCode,
      title,
      credits,
      grade,
      gradePoint,
      type,
    });
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
