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
  resetToInitialData: () => void;
}

export type SemesterStore = SemesterStoreState & SemesterStoreSelectors & SemesterStoreActions;
