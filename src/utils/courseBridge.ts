import type { Course as AppCourse, CourseType as AppCourseType } from '../types';
import type { Course as StoreCourse, TermId, CourseType as StoreCourseType } from '../types/semester';

/**
 * Normalizes course codes for robust equality checks (e.g. "ME 243" === " ME 243 ")
 */
export function normalizeCourseCode(code: string): string {
  return (code || '').replace(/\s+/g, ' ').trim().toUpperCase();
}

/**
 * Converts TermId e.g. "L-2 T-2" -> "L2T2"
 */
export function termIdToSemId(termId: TermId | string): string {
  const digits = (termId || '').replace(/[^0-9]/g, '');
  if (digits.length >= 2) {
    return `L${digits[0]}T${digits[1]}`;
  }
  return (termId || '').replace(/[-\s]/g, '');
}

/**
 * Converts SemesterId e.g. "L2T2", "L-2 T-2", "L2_T2" -> "L-2 T-2"
 */
export function semIdToTermId(semId: string): TermId {
  const digits = (semId || '').replace(/[^0-9]/g, '');
  if (digits.length >= 2) {
    return `L-${digits[0]} T-${digits[1]}` as TermId;
  }
  return (semId as TermId) || 'L-2 T-1';
}

/**
 * Converts a canonical StoreCourse (from useSemesterStore) to legacy AppCourse (for CourseManager & Analytics)
 */
export function storeCourseToAppCourse(sc: StoreCourse, currentTermId: TermId): AppCourse {
  const semId = termIdToSemId(sc.termId);
  const isOngoing = sc.termId === currentTermId;

  return {
    id: `c_${semId}_${sc.code.replace(/[^a-zA-Z0-9]/g, '_')}`,
    code: sc.code,
    title: sc.title,
    nickname: sc.nickname || sc.title,
    credits: sc.credits,
    type: sc.type.toLowerCase() as AppCourseType,
    semesterId: semId,
    teacher: sc.teacher,
    room: sc.room,
    color: sc.color || '#3b82f6',
    isOngoing,
    grade: sc.finalGrade,
    gradePoint: sc.gradePoint,
    projectedGradePoint: sc.gradePoint,
    attendance: sc.attendance
      ? { totalConducted: sc.attendance.conducted, attended: sc.attendance.attended }
      : undefined,
    classTests: sc.classTests
      ? sc.classTests.map((t, idx) => ({
          id: t.id || `ct_${idx + 1}`,
          name: t.name || `CT ${idx + 1}`,
          obtainedMarks: t.score,
          maxMarks: t.outOf,
        }))
      : undefined,
  };
}

/**
 * Converts an AppCourse (from CourseManager) to StoreCourse (for useSemesterStore)
 */
export function appCourseToStoreCourse(ac: AppCourse): StoreCourse {
  const termId = semIdToTermId(ac.semesterId);

  return {
    code: ac.code,
    title: ac.title,
    nickname: ac.nickname,
    credits: ac.credits,
    type: ac.type.toUpperCase() as StoreCourseType,
    termId,
    teacher: ac.teacher,
    room: ac.room,
    color: ac.color,
    finalGrade: ac.grade,
    gradePoint: ac.gradePoint,
    attendance: ac.attendance
      ? { attended: ac.attendance.attended, conducted: ac.attendance.totalConducted }
      : undefined,
    classTests: ac.classTests
      ? ac.classTests.map((t) => ({
          id: t.id,
          name: t.name,
          score: t.obtainedMarks,
          outOf: t.maxMarks,
        }))
      : undefined,
  };
}
