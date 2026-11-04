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

export function cleanOcrArtifacts(line: string): string {
  return line
    .replace(/[\|\[\]\{\}]/g, ' ')
    .replace(/\bA\s*\+\b/gi, 'A+')
    .replace(/\bB\s*\+\b/gi, 'B+')
    .replace(/\bC\s*\+\b/gi, 'C+')
    .replace(/\bA\s*-\b/gi, 'A-')
    .replace(/\bB\s*-\b/gi, 'B-')
    .replace(/\bC\s*-\b/gi, 'C-')
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip headers or administrative lines
    const lower = line.toLowerCase();
    if (
      lower.includes('course no') ||
      lower.includes('course code') ||
      lower.includes('course title') ||
      lower.includes('grade sheet') ||
      lower.includes('bangladesh university') ||
      lower.includes('student id') ||
      lower.includes('term examination') ||
      lower.includes('credit earned') ||
      lower.includes('total credits earned')
    ) {
      continue;
    }

    // Try finding course code in the line
    const match = line.match(COURSE_CODE_REGEX);
    if (!match) {
      continue;
    }

    const fullCode = `${match[1].toUpperCase()} ${match[2]}`;
    const courseNum = parseInt(match[2], 10);

    const codeIndex = line.indexOf(match[0]);
    const afterCode = line.substring(codeIndex + match[0].length).trim();

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
        gradePoint = parsedLastGp;
        grade = secondLastToken;
        credits = parsedThirdCredit;
        title = tokens.slice(0, tokens.length - 3).join(' ').trim();
        matchedBackwards = true;
      }
    }

    // Approach 2: Fallback search if table tokens are scattered
    if (!matchedBackwards) {
      const crMatch = afterCode.match(/\b(0\.75|1\.50?|2\.00?|3\.00?|4\.00?|6\.00?)\b/);
      if (crMatch) {
        credits = parseFloat(crMatch[0]);
      }

      const grMatch = afterCode.match(/(?:^|\s)(A\+|A-|A|B\+|B-|B|C\+|C|D|F|S|X)(?=\s|$)/);
      if (grMatch) {
        grade = grMatch[1];
        gradePoint = GRADE_POINT_MAP[grade] ?? 4.00;
      }

      const gpMatch = afterCode.match(/\b(4\.00?|3\.75|3\.50?|3\.25|3\.00?|2\.75|2\.50?|2\.25|2\.00?|0\.00?)\b/);
      if (gpMatch) {
        gradePoint = parseFloat(gpMatch[0]);
      }

      if (crMatch) {
        const crIdx = afterCode.indexOf(crMatch[0]);
        if (crIdx > 0) {
          title = afterCode.substring(0, crIdx).trim();
        }
      }

      if (!title) {
        title = afterCode
          .replace(new RegExp(`\\b${credits.toFixed(2)}|${credits.toFixed(1)}|${credits}\\b`, 'g'), '')
          .replace(new RegExp(`\\b${grade}\\b`, 'g'), '')
          .replace(new RegExp(`\\b${gradePoint.toFixed(2)}|${gradePoint.toFixed(1)}\\b`, 'g'), '')
          .replace(/\s{2,}/g, ' ')
          .trim();
      }
    }

    if (!title || title.length < 2) {
      title = `Course ${fullCode}`;
    }

    const isSessional = credits <= 1.5 || courseNum % 2 === 0 || /lab|sessional|drawing|shop|project/i.test(title);
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

  const termGpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : undefined;

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
