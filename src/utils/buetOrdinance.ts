import {
  BUET_ATTENDANCE_SLABS,
  BUET_GRADE_SCALE,
  ClassTest,
  Course,
} from '../types';

export interface AttendanceAnalysis {
  percentage: number;
  slabPoints: number;
  attendanceMarks: number;
  maxAttendanceMarks: number;
  slabLabel: string;
  isNonCollegiate: boolean;
  safeBunksCurrentSlab: number;
  safeBunksTo60: number;
  semesterSafeBunksTo60: number;
  maxSemesterClasses: number;
  remainingClasses: number;
  isMaxClassesReached: boolean;
  classesNeededForNextSlab: number | null;
  nextSlabTargetPercent: number | null;
  status: 'safe' | 'warning' | 'danger';
}

/**
 * BUET Academic Ordinance Attendance Calculator
 * 
 * Rules:
 * - A semester has maximum 13 teaching weeks.
 * - An n-credit course conducts n lecture classes per week.
 * - maxSemesterClasses = Math.round(credits * 13)
 * - conducted classes cannot exceed maxSemesterClasses.
 */
export function calculateAttendance(
  credits: number,
  conducted: number,
  attended: number,
  customMaxClasses?: number
): AttendanceAnalysis {
  const cr = credits > 0 ? credits : 3.0;
  const maxSemesterClasses = customMaxClasses ?? Math.max(1, Math.round(cr * 13));
  const safeConducted = Math.min(maxSemesterClasses, Math.max(0, conducted));
  const safeAttended = Math.min(safeConducted, Math.max(0, attended));
  const remainingClasses = Math.max(0, maxSemesterClasses - safeConducted);
  const isMaxClassesReached = safeConducted >= maxSemesterClasses;
  
  const percentage = safeConducted === 0 ? 100 : (safeAttended / safeConducted) * 100;
  const maxAttendanceMarks = cr * 10;

  // Find slab
  let slab = BUET_ATTENDANCE_SLABS.find(
    (s) => percentage >= s.minPercent && percentage <= s.maxPercent
  );

  if (!slab) {
    slab = percentage >= 90 ? BUET_ATTENDANCE_SLABS[0] : BUET_ATTENDANCE_SLABS[BUET_ATTENDANCE_SLABS.length - 1];
  }

  const slabPoints = slab.points;
  const attendanceMarks = (slabPoints / 10) * maxAttendanceMarks; // = slabPoints * credits
  const isNonCollegiate = percentage < 60;

  // Safe bunks to maintain 60% with classes conducted so far
  let safeBunksTo60 = 0;
  if (safeConducted > 0 && percentage >= 60) {
    safeBunksTo60 = Math.max(0, Math.floor(safeAttended / 0.60 - safeConducted));
  }

  // Full semester safe bunks remaining across 13 weeks (total allowed misses = maxClasses - ceil(0.60 * maxClasses))
  const minRequiredForSemester60 = Math.ceil(0.60 * maxSemesterClasses);
  const maxSemesterAllowedMisses = Math.max(0, maxSemesterClasses - minRequiredForSemester60);
  const missedSoFar = safeConducted - safeAttended;
  const semesterSafeBunksTo60 = Math.max(0, maxSemesterAllowedMisses - missedSoFar);

  // Safe bunks to maintain current slab minimum
  let safeBunksCurrentSlab = 0;
  if (safeConducted > 0 && slab.minPercent > 0) {
    const minRatio = slab.minPercent / 100;
    safeBunksCurrentSlab = Math.max(0, Math.floor(safeAttended / minRatio - safeConducted));
  }

  // Classes needed to reach next slab
  let classesNeededForNextSlab: number | null = null;
  let nextSlabTargetPercent: number | null = null;

  if (percentage < 90 && remainingClasses > 0) {
    const higherSlabs = BUET_ATTENDANCE_SLABS.filter((s) => s.minPercent > percentage).sort(
      (a, b) => a.minPercent - b.minPercent
    );

    if (higherSlabs.length > 0) {
      const targetSlab = higherSlabs[0];
      nextSlabTargetPercent = targetSlab.minPercent;
      const targetRatio = targetSlab.minPercent / 100;

      if (safeConducted === 0) {
        classesNeededForNextSlab = 0;
      } else {
        const numerator = targetRatio * safeConducted - safeAttended;
        const denominator = 1 - targetRatio;
        classesNeededForNextSlab = Math.max(0, Math.ceil(numerator / denominator));
      }
    }
  }

  return {
    percentage: Number(percentage.toFixed(2)),
    slabPoints,
    attendanceMarks: Number(attendanceMarks.toFixed(2)),
    maxAttendanceMarks,
    slabLabel: slab.label,
    isNonCollegiate,
    safeBunksCurrentSlab,
    safeBunksTo60,
    semesterSafeBunksTo60,
    maxSemesterClasses,
    remainingClasses,
    isMaxClassesReached,
    classesNeededForNextSlab,
    nextSlabTargetPercent,
    status: slab.status,
  };
}

export interface NormalizedCT extends ClassTest {
  normalizedScore: number; // out of 20
  percentage: number;
  isCounted: boolean;
}

export interface CTAnalysis {
  tests: NormalizedCT[];
  bestCount: number;
  totalTests: number;
  totalCTMarks: number; // out of credits * 20
  maxCTMarks: number;
  ctPercentage: number;
  averageCTPercentage: number;
}

export function calculateClassTests(
  credits: number,
  classTests: ClassTest[] = [],
  useCustomBestCount?: boolean,
  customBestCount?: number
): CTAnalysis {
  // Integer credits for best n rule (standard theory is 2.0, 3.0, 4.0)
  const n = Math.max(1, Math.round(credits));
  const bestCount = useCustomBestCount && customBestCount ? customBestCount : n;
  const maxCTMarks = credits * 20;

  if (!classTests || classTests.length === 0) {
    return {
      tests: [],
      bestCount,
      totalTests: 0,
      totalCTMarks: 0,
      maxCTMarks,
      ctPercentage: 0,
      averageCTPercentage: 0,
    };
  }

  // Normalize each CT to base 20
  const normalizedList = classTests.map((ct) => {
    const max = ct.maxMarks > 0 ? ct.maxMarks : 20;
    const obtained = Math.max(0, ct.obtainedMarks);
    const score20 = (obtained / max) * 20;
    const pct = (obtained / max) * 100;
    return {
      ...ct,
      normalizedScore: Number(score20.toFixed(2)),
      percentage: Number(pct.toFixed(1)),
      isCounted: false,
    };
  });

  // Sort descending by normalizedScore to pick best k
  const sortedIndices = normalizedList
    .map((item, idx) => ({ idx, score: item.normalizedScore }))
    .sort((a, b) => b.score - a.score);

  const topIndices = new Set(sortedIndices.slice(0, bestCount).map((item) => item.idx));

  let totalCTMarks = 0;
  const processedTests: NormalizedCT[] = normalizedList.map((item, idx) => {
    const isCounted = topIndices.has(idx);
    if (isCounted) {
      totalCTMarks += item.normalizedScore;
    }
    return {
      ...item,
      isCounted,
    };
  });

  const ctPercentage = maxCTMarks > 0 ? (totalCTMarks / maxCTMarks) * 100 : 0;
  
  // All tests mean
  const allSumPct = normalizedList.reduce((sum, t) => sum + t.percentage, 0);
  const averageCTPercentage = normalizedList.length > 0 ? allSumPct / normalizedList.length : 0;

  return {
    tests: processedTests,
    bestCount,
    totalTests: classTests.length,
    totalCTMarks: Number(totalCTMarks.toFixed(2)),
    maxCTMarks,
    ctPercentage: Number(ctPercentage.toFixed(2)),
    averageCTPercentage: Number(averageCTPercentage.toFixed(1)),
  };
}

export interface TFTargetRow {
  grade: string;
  gradePoint: number;
  minPercentage: number;
  requiredCourseMarks: number;
  requiredTFMarks: number;
  maxTFMarks: number;
  requiredTFPercentage: number;
  targetSectionA: number;
  targetSectionB: number;
  status: 'secured' | 'comfortable' | 'achievable' | 'demanding' | 'impossible';
  statusLabel: string;
}

export interface ContinuousAssessmentSummary {
  credits: number;
  attendance: AttendanceAnalysis;
  classTests: CTAnalysis;
  continuousMarksObtained: number; // CT + Att
  maxContinuousMarks: number; // 30 * credits
  continuousPercentage: number;
  maxTFMarks: number; // 70 * credits
  totalCourseMarks: number; // 100 * credits
  tfTargets: TFTargetRow[];
}

export function evaluateCourseAssessment(course: Course): ContinuousAssessmentSummary {
  const credits = course.credits || 3.0;
  const attendance = calculateAttendance(
    credits,
    course.attendance?.conducted ?? course.attendance?.totalConducted ?? 0,
    course.attendance?.attended || 0
  );

  const classTests = calculateClassTests(
    credits,
    course.classTests || [],
    course.useCustomBestCount,
    course.customBestCount
  );

  const continuousMarksObtained = Number((attendance.attendanceMarks + classTests.totalCTMarks).toFixed(2));
  const maxContinuousMarks = credits * 30; // 10 Att + 20 CT
  const continuousPercentage = maxContinuousMarks > 0 ? (continuousMarksObtained / maxContinuousMarks) * 100 : 0;
  const maxTFMarks = credits * 70;
  const totalCourseMarks = credits * 100;

  // Calculate targets for each BUET grade
  const tfTargets: TFTargetRow[] = BUET_GRADE_SCALE.filter((g) => g.grade !== 'F').map((scale) => {
    const requiredCourseMarks = (scale.minPercentage / 100) * totalCourseMarks;
    const rawTFNeeded = requiredCourseMarks - continuousMarksObtained;
    const requiredTFMarks = Number(Math.max(0, rawTFNeeded).toFixed(2));
    const requiredTFPercentage = maxTFMarks > 0 ? Number(((rawTFNeeded / maxTFMarks) * 100).toFixed(1)) : 0;
    
    // Split 50/50 for Section A and Section B
    const targetSectionA = Number((requiredTFMarks / 2).toFixed(2));
    const targetSectionB = Number((requiredTFMarks / 2).toFixed(2));

    let status: TFTargetRow['status'] = 'achievable';
    let statusLabel = 'Achievable';

    if (rawTFNeeded <= 0) {
      status = 'secured';
      statusLabel = 'Secured!';
    } else if (rawTFNeeded > maxTFMarks) {
      status = 'impossible';
      statusLabel = 'Unreachable';
    } else if (requiredTFPercentage > 85) {
      status = 'demanding';
      statusLabel = 'Demanding (>85%)';
    } else if (requiredTFPercentage <= 65) {
      status = 'comfortable';
      statusLabel = 'Comfortable';
    } else {
      status = 'achievable';
      statusLabel = 'Achievable';
    }

    return {
      grade: scale.grade,
      gradePoint: scale.gradePoint,
      minPercentage: scale.minPercentage,
      requiredCourseMarks: Number(requiredCourseMarks.toFixed(1)),
      requiredTFMarks,
      maxTFMarks,
      requiredTFPercentage,
      targetSectionA,
      targetSectionB,
      status,
      statusLabel,
    };
  });

  return {
    credits,
    attendance,
    classTests,
    continuousMarksObtained,
    maxContinuousMarks,
    continuousPercentage: Number(continuousPercentage.toFixed(2)),
    maxTFMarks,
    totalCourseMarks,
    tfTargets,
  };
}

export function calculateGPA(courses: { credits: number; gradePoint?: number }[]): {
  totalCredits: number;
  earnedCredits: number;
  gpa: number;
} {
  let totalPoints = 0;
  let totalCredits = 0;
  let earnedCredits = 0;

  courses.forEach((c) => {
    if (typeof c.gradePoint === 'number' && !isNaN(c.gradePoint)) {
      totalCredits += c.credits;
      totalPoints += c.credits * c.gradePoint;
      if (c.gradePoint > 0) {
        earnedCredits += c.credits;
      }
    }
  });

  const gpa = totalCredits > 0 ? Number((totalPoints / totalCredits).toFixed(2)) : 0.0;

  return {
    totalCredits: Number(totalCredits.toFixed(2)),
    earnedCredits: Number(earnedCredits.toFixed(2)),
    gpa,
  };
}

