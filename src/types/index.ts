export type DayOfWeek = 'Saturday' | 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday';

export interface PeriodDefinition {
  id: number;
  name: string;
  timeRange: string;
  isBreak?: boolean;
}

export const BUET_PERIODS: PeriodDefinition[] = [
  { id: 1, name: 'Period 1', timeRange: '8:00 - 8:50' },
  { id: 2, name: 'Period 2', timeRange: '9:00 - 9:50' },
  { id: 3, name: 'Period 3', timeRange: '10:00 - 10:50' },
  { id: 4, name: 'Period 4', timeRange: '11:00 - 11:50' },
  { id: 5, name: 'Period 5', timeRange: '12:00 - 12:50' },
  { id: 6, name: 'Period 6', timeRange: '1:00 - 1:30' },
  { id: 0, name: 'RECESS', timeRange: '1:30 - 2:30', isBreak: true },
  { id: 7, name: 'Period 7 (Lab)', timeRange: '2:30 - 5:00' },
];

export const BUET_DAYS: DayOfWeek[] = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday'];

export type CourseType = 'theory' | 'sessional';

export interface ClassTest {
  id: string;
  name: string; // e.g. "CT 1", "CT 2", "Makeup CT"
  obtainedMarks: number;
  maxMarks: number;
  date?: string;
  topic?: string;
}

export interface AttendanceRecord {
  totalConducted: number;
  attended: number;
}

export interface Course {
  id: string;
  code: string; // e.g., "ME 243", "IPE 205"
  title: string; // e.g., "Mechanics of Solids"
  nickname: string; // e.g., "Solid Mech"
  credits: number; // 3.0, 2.0, 4.0, 0.75, 1.5
  type: CourseType;
  semesterId: string; // "L1T1", "L2T1", etc.
  teacher?: string; // e.g. "SA Ma'am"
  room?: string; // e.g. "IPE 317"
  color: string; // Hex or tailwind color
  isOngoing: boolean;
  
  // For completed courses:
  grade?: string; // "A+", "A", "A-", etc.
  gradePoint?: number; // 4.00, 3.75, etc.

  // Continuous assessment for ongoing theory courses:
  attendance?: AttendanceRecord;
  classTests?: ClassTest[];
  customBestCount?: number; // Override best n
  useCustomBestCount?: boolean;

  // For sessional / projected grade:
  projectedGradePoint?: number;
  sessionalNotes?: string;
}

export interface RoutineSlot {
  id: string;
  day: DayOfWeek;
  periodId: number; // 1..7 (not 0, break is fixed)
  span: number; // spans across consecutive periods (e.g. 1, 2, or 3)
  courseId?: string;
  customCode?: string;
  customNickname?: string;
  customTeacher?: string;
  customRoom?: string;
  customColor?: string;
}

export interface RoutineMetadata {
  id: string;
  title: string; // e.g. "Class Routine of IPE'23 Section A"
  subTitle: string; // e.g. "Level-2 Term-1 | Department of Industrial & Production Engineering, BUET"
  effectiveDate: string; // e.g. "Effective from: November 2026"
  slots: RoutineSlot[];
}

export interface SemesterInfo {
  id: string; // "L1T1", "L1T2", "L2T1", ...
  level: number; // 1, 2, 3, 4
  term: number; // 1, 2
  label: string; // "Level-1 Term-1"
  shortLabel: string; // "L-1 T-1"
  isCurrent: boolean;
}

export const BUET_SEMESTERS: SemesterInfo[] = [
  { id: 'L1T1', level: 1, term: 1, label: 'Level-1 Term-1', shortLabel: 'L-1 T-1', isCurrent: false },
  { id: 'L1T2', level: 1, term: 2, label: 'Level-1 Term-2', shortLabel: 'L-1 T-2', isCurrent: false },
  { id: 'L2T1', level: 2, term: 1, label: 'Level-2 Term-1', shortLabel: 'L-2 T-1', isCurrent: true },
  { id: 'L2T2', level: 2, term: 2, label: 'Level-2 Term-2', shortLabel: 'L-2 T-2', isCurrent: false },
  { id: 'L3T1', level: 3, term: 1, label: 'Level-3 Term-1', shortLabel: 'L-3 T-1', isCurrent: false },
  { id: 'L3T2', level: 3, term: 2, label: 'Level-3 Term-2', shortLabel: 'L-3 T-2', isCurrent: false },
  { id: 'L4T1', level: 4, term: 1, label: 'Level-4 Term-1', shortLabel: 'L-4 T-1', isCurrent: false },
  { id: 'L4T2', level: 4, term: 2, label: 'Level-4 Term-2', shortLabel: 'L-4 T-2', isCurrent: false },
];

export interface BUETGradeScale {
  grade: string;
  gradePoint: number;
  minPercentage: number;
  label: string;
}

export const BUET_GRADE_SCALE: BUETGradeScale[] = [
  { grade: 'A+', gradePoint: 4.00, minPercentage: 80, label: '80% and above' },
  { grade: 'A',  gradePoint: 3.75, minPercentage: 75, label: '75% to <80%' },
  { grade: 'A-', gradePoint: 3.50, minPercentage: 70, label: '70% to <75%' },
  { grade: 'B+', gradePoint: 3.25, minPercentage: 65, label: '65% to <70%' },
  { grade: 'B',  gradePoint: 3.00, minPercentage: 60, label: '60% to <65%' },
  { grade: 'B-', gradePoint: 2.75, minPercentage: 55, label: '55% to <60%' },
  { grade: 'C+', gradePoint: 2.50, minPercentage: 50, label: '50% to <55%' },
  { grade: 'C',  gradePoint: 2.25, minPercentage: 45, label: '45% to <50%' },
  { grade: 'D',  gradePoint: 2.00, minPercentage: 40, label: '40% to <45%' },
  { grade: 'F',  gradePoint: 0.00, minPercentage: 0,  label: 'Less than 40%' },
];

export interface AttendanceSlab {
  minPercent: number;
  maxPercent: number;
  points: number; // out of 10
  status: 'safe' | 'warning' | 'danger';
  label: string;
}

export const BUET_ATTENDANCE_SLABS: AttendanceSlab[] = [
  { minPercent: 90, maxPercent: 100, points: 10, status: 'safe', label: '≥ 90% (10/10)' },
  { minPercent: 85, maxPercent: 89.99, points: 9, status: 'safe', label: '85% - 89% (9/10)' },
  { minPercent: 80, maxPercent: 84.99, points: 8, status: 'safe', label: '80% - 84% (8/10)' },
  { minPercent: 75, maxPercent: 79.99, points: 7, status: 'safe', label: '75% - 79% (7/10)' },
  { minPercent: 70, maxPercent: 74.99, points: 6, status: 'warning', label: '70% - 74% (6/10)' },
  { minPercent: 65, maxPercent: 69.99, points: 5, status: 'warning', label: '65% - 69% (5/10)' },
  { minPercent: 60, maxPercent: 64.99, points: 4, status: 'warning', label: '60% - 64% (4/10)' },
  { minPercent: 0,  maxPercent: 59.99, points: 0, status: 'danger', label: '< 60% (Non-Collegiate / Ineligible)' },
];

export interface UserSettings {
  studentName: string;
  studentId: string;
  department: string;
  totalDegreeCredits: number;
  currentSemesterId: string;
  theme: 'dark' | 'light' | 'buet';
  isOnboarded?: boolean;
}

