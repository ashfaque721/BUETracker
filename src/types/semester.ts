/**
 * Relational Types for BUET Semester and Course State Architecture
 */

export type TermId =
  | 'L-1 T-1'
  | 'L-1 T-2'
  | 'L-2 T-1'
  | 'L-2 T-2'
  | 'L-3 T-1'
  | 'L-3 T-2'
  | 'L-4 T-1'
  | 'L-4 T-2';

export const ALL_TERM_IDS: readonly TermId[] = [
  'L-1 T-1',
  'L-1 T-2',
  'L-2 T-1',
  'L-2 T-2',
  'L-3 T-1',
  'L-3 T-2',
  'L-4 T-1',
  'L-4 T-2',
] as const;

export type CourseType = 'THEORY' | 'SESSIONAL';

export type DayOfWeek =
  | 'Saturday'
  | 'Sunday'
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday';

export interface ClassTest {
  id?: string;
  name?: string;
  score: number;
  outOf: number;
  isCounted?: boolean;
}

export interface AttendanceRecord {
  attended: number;
  conducted: number;
}

export interface Course {
  code: string;
  title: string;
  credits: number;
  type: CourseType;
  termId: TermId;
  nickname?: string;
  teacher?: string;
  room?: string;
  color?: string;

  // For completed terms:
  finalGrade?: string;
  gradePoint?: number;

  // For current active term only:
  attendance?: AttendanceRecord;
  classTests?: ClassTest[];

  // Archival continuous assessment history:
  archivedAttendance?: AttendanceRecord;
  archivedClassTests?: ClassTest[];
}

export interface RoutineSlotDetails {
  title?: string;
  nickname?: string;
  teacher?: string;
  room?: string;
  span?: number;
  type?: CourseType;
  color?: string;
}

export interface RoutineSlot {
  id: string;
  day: DayOfWeek | string;
  periodIndex: number;
  courseCode: string;
  details?: RoutineSlotDetails;
}

export interface SemesterStoreState {
  currentTermId: TermId;
  courses: Course[];
  routineSlots: RoutineSlot[];
}

export interface SemesterStoreSelectors {
  currentCourses: Course[];
  currentTheoryCourses: Course[];
  currentSessionalCourses: Course[];
  currentTermCredits: number;
  completedCourses: Course[];
  completedCredits: number;
  cumulativeCGPA: number;
  termCreditsMap: Record<TermId, number>;
  termGpaMap: Record<string, number>;
}

export interface SemesterGradeInput {
  code: string;
  finalGrade: string;
  gradePoint: number;
}

export interface CompleteSemesterResult {
  completedTermId: TermId;
  nextTermId: TermId | null;
  termGPA: number;
  termCredits: number;
  newCumulativeCGPA: number;
  totalCompletedCredits: number;
}

export interface SemesterStoreActions {
  setCurrentTermId: (termId: TermId) => void;
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  setRoutineSlots: React.Dispatch<React.SetStateAction<RoutineSlot[]>>;
  addAttendance: (courseCode: string, isAttended: boolean) => void;
  addOrUpdateCT: (courseCode: string, ctIndex: number, score: number, outOf: number) => void;
  assignRoutineSlot: (
    day: DayOfWeek | string,
    periodIndex: number,
    courseCode: string,
    details?: RoutineSlotDetails
  ) => void;
  removeRoutineSlot: (day: DayOfWeek | string, periodIndex: number) => void;
  completeSemester: (grades: SemesterGradeInput[]) => CompleteSemesterResult;
  switchTerm: (termId: TermId) => void;
  updateCourseGrade: (termId: TermId, courseCode: string, finalGrade: string, gradePoint: number) => void;
  resetToInitialData: () => void;
}

export type SemesterStore = SemesterStoreState & SemesterStoreSelectors & SemesterStoreActions;

/**
 * Returns next academic term in chronological order, or null if final term (L-4 T-2).
 */
export function getNextTermId(currentTermId: TermId): TermId | null {
  const index = ALL_TERM_IDS.indexOf(currentTermId);
  if (index >= 0 && index < ALL_TERM_IDS.length - 1) {
    return ALL_TERM_IDS[index + 1];
  }
  return null;
}

/**
 * Official BUET Letter Grade to Grade Point Mapping (Ordinance Standard)
 */
export const BUET_GRADE_POINTS: Record<string, number> = {
  'A+': 4.0,
  'A': 3.75,
  'A-': 3.5,
  'B+': 3.25,
  'B': 3.0,
  'B-': 2.75,
  'C+': 2.5,
  'C': 2.25,
  'D': 2.0,
  'F': 0.0,
};
