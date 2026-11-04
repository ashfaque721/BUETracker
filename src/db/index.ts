import Dexie, { Table } from 'dexie';
import { Course, RoutineMetadata, UserSettings } from '../types';

export class BUETrackerDB extends Dexie {
  courses!: Table<Course, string>;
  routines!: Table<RoutineMetadata, string>;
  settings!: Table<UserSettings & { id: string }, string>;

  constructor() {
    super('BUETrackerDB');
    this.version(1).stores({
      courses: 'id, code, semesterId, type, isOngoing',
      routines: 'id',
      settings: 'id',
    });
  }
}

export const db = new BUETrackerDB();

export const SEED_SETTINGS: UserSettings = {
  studentName: 'Ashfaque Amin Eshan',
  studentId: '2308001',
  department: 'Industrial & Production Engineering (IPE)',
  totalDegreeCredits: 160,
  currentSemesterId: 'L2T1',
  theme: 'dark',
  isOnboarded: true,
};

export const SEED_COURSES: Course[] = [
  // --- Level-1 Term-1 (Completed) ---
  {
    id: 'c_l1t1_1',
    code: 'MATH 191',
    title: 'Differential and Integral Calculus',
    nickname: 'Calculus',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L1T1',
    color: '#3b82f6',
    isOngoing: false,
    grade: 'A+',
    gradePoint: 4.0,
  },
  {
    id: 'c_l1t1_2',
    code: 'PHY 109',
    title: 'Physics I (Heat, Waves and Optics)',
    nickname: 'Physics I',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L1T1',
    color: '#8b5cf6',
    isOngoing: false,
    grade: 'A',
    gradePoint: 3.75,
  },
  {
    id: 'c_l1t1_3',
    code: 'CHEM 109',
    title: 'Chemistry I',
    nickname: 'Chemistry',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L1T1',
    color: '#06b6d4',
    isOngoing: false,
    grade: 'A+',
    gradePoint: 4.0,
  },
  {
    id: 'c_l1t1_4',
    code: 'HUM 101',
    title: 'English and Economics',
    nickname: 'English',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L1T1',
    color: '#ec4899',
    isOngoing: false,
    grade: 'A-',
    gradePoint: 3.5,
  },
  {
    id: 'c_l1t1_5',
    code: 'ME 160',
    title: 'Mechanical Engineering Drawing-I',
    nickname: 'Drawing Lab',
    credits: 1.5,
    type: 'sessional',
    semesterId: 'L1T1',
    color: '#f59e0b',
    isOngoing: false,
    grade: 'A+',
    gradePoint: 4.0,
  },
  {
    id: 'c_l1t1_6',
    code: 'PHY 102',
    title: 'Physics Sessional',
    nickname: 'Phy Lab',
    credits: 1.5,
    type: 'sessional',
    semesterId: 'L1T1',
    color: '#8b5cf6',
    isOngoing: false,
    grade: 'A+',
    gradePoint: 4.0,
  },
  {
    id: 'c_l1t1_7',
    code: 'CHEM 114',
    title: 'Inorganic Quantitative Analysis Lab',
    nickname: 'Chem Lab',
    credits: 1.5,
    type: 'sessional',
    semesterId: 'L1T1',
    color: '#06b6d4',
    isOngoing: false,
    grade: 'A',
    gradePoint: 3.75,
  },
  {
    id: 'c_l1t1_8',
    code: 'SHOP 170',
    title: 'Foundry, Welding & Machine Shop',
    nickname: 'Shop Sessional',
    credits: 1.5,
    type: 'sessional',
    semesterId: 'L1T1',
    color: '#10b981',
    isOngoing: false,
    grade: 'A+',
    gradePoint: 4.0,
  },

  // --- Level-1 Term-2 (Completed) ---
  {
    id: 'c_l1t2_1',
    code: 'MATH 193',
    title: 'Vector Analysis, Matrices and Coordinate Geometry',
    nickname: 'Linear Algebra',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L1T2',
    color: '#3b82f6',
    isOngoing: false,
    grade: 'A+',
    gradePoint: 4.0,
  },
  {
    id: 'c_l1t2_2',
    code: 'PHY 159',
    title: 'Physics II (Modern Physics & Quantum Mechanics)',
    nickname: 'Physics II',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L1T2',
    color: '#8b5cf6',
    isOngoing: false,
    grade: 'A',
    gradePoint: 3.75,
  },
  {
    id: 'c_l1t2_3',
    code: 'CHEM 141',
    title: 'Physical and Organic Chemistry',
    nickname: 'Organic Chem',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L1T2',
    color: '#06b6d4',
    isOngoing: false,
    grade: 'A-',
    gradePoint: 3.5,
  },
  {
    id: 'c_l1t2_4',
    code: 'EEE 159',
    title: 'Fundamentals of Electrical Engineering',
    nickname: 'Basic Electrical',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L1T2',
    color: '#eab308',
    isOngoing: false,
    grade: 'B+',
    gradePoint: 3.25,
  },
  {
    id: 'c_l1t2_5',
    code: 'IPE 101',
    title: 'Introduction to Industrial & Production Engineering',
    nickname: 'Intro to IPE',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L1T2',
    color: '#059669',
    isOngoing: false,
    grade: 'A+',
    gradePoint: 4.0,
  },
  {
    id: 'c_l1t2_6',
    code: 'EEE 160',
    title: 'Electrical Engineering Sessional',
    nickname: 'EEE Lab',
    credits: 1.5,
    type: 'sessional',
    semesterId: 'L1T2',
    color: '#eab308',
    isOngoing: false,
    grade: 'A+',
    gradePoint: 4.0,
  },
  {
    id: 'c_l1t2_7',
    code: 'ME 170',
    title: 'Machine Shop Practice Sessional',
    nickname: 'Machine Shop',
    credits: 1.5,
    type: 'sessional',
    semesterId: 'L1T2',
    color: '#f97316',
    isOngoing: false,
    grade: 'A+',
    gradePoint: 4.0,
  },

  // --- Level-2 Term-1 (Ongoing Semester - BUET IPE '23 batch) ---
  {
    id: 'c_l2t1_1',
    code: 'ME 243',
    title: 'Mechanics of Solids',
    nickname: 'Solid Mech',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L2T1',
    teacher: "SA Ma'am",
    room: 'Room: IPE 317',
    color: '#dc2626', // Red
    isOngoing: true,
    attendance: {
      totalConducted: 26,
      attended: 24, // 92.3% -> 10/10 slab points
    },
    classTests: [
      { id: 'ct1_me243', name: 'CT 1 (Stress & Strain)', obtainedMarks: 17, maxMarks: 20 },
      { id: 'ct2_me243', name: 'CT 2 (Torsion & Bending)', obtainedMarks: 18.5, maxMarks: 20 },
      { id: 'ct3_me243', name: 'CT 3 (Shear Force & BM)', obtainedMarks: 14, maxMarks: 20 },
      { id: 'ct4_me243', name: 'CT 4 (Deflection of Beams)', obtainedMarks: 19, maxMarks: 20 },
    ],
  },
  {
    id: 'c_l2t1_2',
    code: 'ME 265',
    title: 'Thermal Engineering and Heat Transfer',
    nickname: 'Thermal Engg',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L2T1',
    teacher: 'Kayes Sir',
    room: 'Room: IPE 317',
    color: '#ea580c', // Orange
    isOngoing: true,
    attendance: {
      totalConducted: 24,
      attended: 21, // 87.5% -> 9/10 slab points
    },
    classTests: [
      { id: 'ct1_me265', name: 'CT 1 (1st Law & Cycles)', obtainedMarks: 16, maxMarks: 20 },
      { id: 'ct2_me265', name: 'CT 2 (2nd Law & Entropy)', obtainedMarks: 15.5, maxMarks: 20 },
      { id: 'ct3_me265', name: 'CT 3 (Conduction & Fins)', obtainedMarks: 18, maxMarks: 20 },
      { id: 'ct4_me265', name: 'CT 4 (Convection & Radiation)', obtainedMarks: 13, maxMarks: 20 },
    ],
  },
  {
    id: 'c_l2t1_3',
    code: 'IPE 205',
    title: 'Manufacturing Processes I',
    nickname: 'Mfg I',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L2T1',
    teacher: 'AHS Sir',
    room: 'Room: IPE 317',
    color: '#2563eb', // Blue
    isOngoing: true,
    attendance: {
      totalConducted: 25,
      attended: 23, // 92% -> 10/10 slab points
    },
    classTests: [
      { id: 'ct1_ipe205', name: 'CT 1 (Casting & Molding)', obtainedMarks: 19, maxMarks: 20 },
      { id: 'ct2_ipe205', name: 'CT 2 (Forming & Rolling)', obtainedMarks: 17.5, maxMarks: 20 },
      { id: 'ct3_ipe205', name: 'CT 3 (Sheet Metal Working)', obtainedMarks: 18, maxMarks: 20 },
      { id: 'ct4_ipe205', name: 'CT 4 (Joining Processes)', obtainedMarks: 16.5, maxMarks: 20 },
    ],
  },
  {
    id: 'c_l2t1_4',
    code: 'IPE 207',
    title: 'Engineering Metallurgy',
    nickname: 'Metallurgy',
    credits: 3.0,
    type: 'theory',
    semesterId: 'L2T1',
    teacher: 'NA Sir',
    room: 'Room: IPE 317',
    color: '#7c3aed', // Purple
    isOngoing: true,
    attendance: {
      totalConducted: 26,
      attended: 21, // 80.7% -> 8/10 slab points
    },
    classTests: [
      { id: 'ct1_ipe207', name: 'CT 1 (Crystal Lattice & Defects)', obtainedMarks: 14.5, maxMarks: 20 },
      { id: 'ct2_ipe207', name: 'CT 2 (Phase Diagrams & Fe-C)', obtainedMarks: 16, maxMarks: 20 },
      { id: 'ct3_ipe207', name: 'CT 3 (TTT Diagrams & Heat Treat)', obtainedMarks: 15, maxMarks: 20 },
    ],
  },
  {
    id: 'c_l2t1_5',
    code: 'IPE 209',
    title: 'Engineering Economy',
    nickname: 'Engg Economy',
    credits: 2.0,
    type: 'theory',
    semesterId: 'L2T1',
    teacher: 'FMS Sir',
    room: 'Room: IPE 317',
    color: '#059669', // Emerald
    isOngoing: true,
    attendance: {
      totalConducted: 18,
      attended: 17, // 94.4% -> 10/10 points
    },
    classTests: [
      { id: 'ct1_ipe209', name: 'CT 1 (Time Value of Money)', obtainedMarks: 18.5, maxMarks: 20 },
      { id: 'ct2_ipe209', name: 'CT 2 (NPV & IRR Evaluation)', obtainedMarks: 19, maxMarks: 20 },
      { id: 'ct3_ipe209', name: 'CT 3 (Depreciation & Taxes)', obtainedMarks: 16, maxMarks: 20 },
    ],
  },

  // Ongoing Sessionals (Labs)
  {
    id: 'c_l2t1_s1',
    code: 'ME 244',
    title: 'Mechanics of Solids Sessional',
    nickname: 'SM Lab',
    credits: 0.75,
    type: 'sessional',
    semesterId: 'L2T1',
    teacher: "SA Ma'am / Lab Team",
    room: 'SM Lab',
    color: '#dc2626',
    isOngoing: true,
    projectedGradePoint: 4.0,
    sessionalNotes: 'Tension, compression & impact tests completed. Viva pending.',
  },
  {
    id: 'c_l2t1_s2',
    code: 'ME 266',
    title: 'Thermal Engineering Sessional',
    nickname: 'Thermal Lab',
    credits: 0.75,
    type: 'sessional',
    semesterId: 'L2T1',
    teacher: 'Kayes Sir / Lab Team',
    room: 'Heat Transfer Lab',
    color: '#ea580c',
    isOngoing: true,
    projectedGradePoint: 3.75,
    sessionalNotes: 'Conduction, convective heat exchanger experiment reports submitted.',
  },
  {
    id: 'c_l2t1_s3',
    code: 'IPE 206',
    title: 'Manufacturing Processes I Sessional',
    nickname: 'Mfg I Lab',
    credits: 0.75,
    type: 'sessional',
    semesterId: 'L2T1',
    teacher: 'AHS Sir / Inst.',
    room: 'Machine Tools Lab',
    color: '#2563eb',
    isOngoing: true,
    projectedGradePoint: 4.0,
    sessionalNotes: 'Lathe, Shaper and Milling machine jobs finished.',
  },
  {
    id: 'c_l2t1_s4',
    code: 'IPE 208',
    title: 'Engineering Metallurgy Sessional',
    nickname: 'AM Lab',
    credits: 0.75,
    type: 'sessional',
    semesterId: 'L2T1',
    teacher: 'NA Sir / Lab Team',
    room: 'AM Lab',
    color: '#7c3aed',
    isOngoing: true,
    projectedGradePoint: 4.0,
    sessionalNotes: 'Microstructure polishing and hardness indentation labs.',
  },
];

export const SEED_ROUTINE: RoutineMetadata = {
  id: 'routine_default_ipe23_a',
  title: "Class Routine of IPE'23 Section A",
  subTitle: 'Level-2 Term-1 | Department of Industrial & Production Engineering, BUET',
  effectiveDate: 'Effective from: November 2026',
  slots: [
    // --- Saturday ---
    {
      id: 'slot_sat_p1',
      day: 'Saturday',
      periodId: 1,
      span: 1,
      courseId: 'c_l2t1_1',
      customCode: 'ME 243',
      customNickname: '(Solid Mech)',
      customTeacher: "SA Ma'am",
      customRoom: 'Room: IPE 317',
      customColor: '#dc2626',
    },
    {
      id: 'slot_sat_p2',
      day: 'Saturday',
      periodId: 2,
      span: 1,
      courseId: 'c_l2t1_3',
      customCode: 'IPE 205',
      customNickname: '(Mfg I)',
      customTeacher: 'AHS Sir',
      customRoom: 'Room: IPE 317',
      customColor: '#2563eb',
    },
    {
      id: 'slot_sat_p3',
      day: 'Saturday',
      periodId: 3,
      span: 1,
      courseId: 'c_l2t1_2',
      customCode: 'ME 265',
      customNickname: '(Thermal Engg)',
      customTeacher: 'Kayes Sir',
      customRoom: 'Room: IPE 317',
      customColor: '#ea580c',
    },
    {
      id: 'slot_sat_p4',
      day: 'Saturday',
      periodId: 4,
      span: 1,
      courseId: 'c_l2t1_4',
      customCode: 'IPE 207',
      customNickname: '(Metallurgy)',
      customTeacher: 'NA Sir',
      customRoom: 'Room: IPE 317',
      customColor: '#7c3aed',
    },
    // Saturday afternoon lab (Period 7: 2:30 - 5:00)
    {
      id: 'slot_sat_p7',
      day: 'Saturday',
      periodId: 7,
      span: 1,
      courseId: 'c_l2t1_s1',
      customCode: 'ME 244',
      customNickname: '(Solid Mech Lab)',
      customTeacher: "SA Ma'am / Team",
      customRoom: 'SM Lab / Testing Lab',
      customColor: '#dc2626',
    },

    // --- Sunday ---
    {
      id: 'slot_sun_p2',
      day: 'Sunday',
      periodId: 2,
      span: 1,
      courseId: 'c_l2t1_5',
      customCode: 'IPE 209',
      customNickname: '(Engg Economy)',
      customTeacher: 'FMS Sir',
      customRoom: 'Room: IPE 317',
      customColor: '#059669',
    },
    {
      id: 'slot_sun_p3',
      day: 'Sunday',
      periodId: 3,
      span: 1,
      courseId: 'c_l2t1_1',
      customCode: 'ME 243',
      customNickname: '(Solid Mech)',
      customTeacher: "SA Ma'am",
      customRoom: 'Room: IPE 317',
      customColor: '#dc2626',
    },
    {
      id: 'slot_sun_p4',
      day: 'Sunday',
      periodId: 4,
      span: 1,
      courseId: 'c_l2t1_2',
      customCode: 'ME 265',
      customNickname: '(Thermal Engg)',
      customTeacher: 'Kayes Sir',
      customRoom: 'Room: IPE 317',
      customColor: '#ea580c',
    },
    // Sunday afternoon lab (Period 7)
    {
      id: 'slot_sun_p7',
      day: 'Sunday',
      periodId: 7,
      span: 1,
      courseId: 'c_l2t1_s3',
      customCode: 'IPE 206',
      customNickname: '(Mfg I Lab)',
      customTeacher: 'AHS Sir / Team',
      customRoom: 'Machine Tools Lab',
      customColor: '#2563eb',
    },

    // --- Monday ---
    {
      id: 'slot_mon_p1',
      day: 'Monday',
      periodId: 1,
      span: 1,
      courseId: 'c_l2t1_4',
      customCode: 'IPE 207',
      customNickname: '(Metallurgy)',
      customTeacher: 'NA Sir',
      customRoom: 'Room: IPE 317',
      customColor: '#7c3aed',
    },
    {
      id: 'slot_mon_p2',
      day: 'Monday',
      periodId: 2,
      span: 1,
      courseId: 'c_l2t1_3',
      customCode: 'IPE 205',
      customNickname: '(Mfg I)',
      customTeacher: 'AHS Sir',
      customRoom: 'Room: IPE 317',
      customColor: '#2563eb',
    },
    {
      id: 'slot_mon_p3',
      day: 'Monday',
      periodId: 3,
      span: 1,
      courseId: 'c_l2t1_5',
      customCode: 'IPE 209',
      customNickname: '(Engg Economy)',
      customTeacher: 'FMS Sir',
      customRoom: 'Room: IPE 317',
      customColor: '#059669',
    },
    // Monday afternoon lab (Period 7)
    {
      id: 'slot_mon_p7',
      day: 'Monday',
      periodId: 7,
      span: 1,
      courseId: 'c_l2t1_s4',
      customCode: 'IPE 208',
      customNickname: '(AM Lab)',
      customTeacher: 'NA Sir / Lab Team',
      customRoom: 'AM Lab',
      customColor: '#7c3aed',
    },

    // --- Tuesday ---
    {
      id: 'slot_tue_p1',
      day: 'Tuesday',
      periodId: 1,
      span: 1,
      courseId: 'c_l2t1_2',
      customCode: 'ME 265',
      customNickname: '(Thermal Engg)',
      customTeacher: 'Kayes Sir',
      customRoom: 'Room: IPE 317',
      customColor: '#ea580c',
    },
    {
      id: 'slot_tue_p2',
      day: 'Tuesday',
      periodId: 2,
      span: 1,
      courseId: 'c_l2t1_1',
      customCode: 'ME 243',
      customNickname: '(Solid Mech)',
      customTeacher: "SA Ma'am",
      customRoom: 'Room: IPE 317',
      customColor: '#dc2626',
    },
    {
      id: 'slot_tue_p3',
      day: 'Tuesday',
      periodId: 3,
      span: 1,
      courseId: 'c_l2t1_4',
      customCode: 'IPE 207',
      customNickname: '(Metallurgy)',
      customTeacher: 'NA Sir',
      customRoom: 'Room: IPE 317',
      customColor: '#7c3aed',
    },
    // Tuesday afternoon lab (Period 7)
    {
      id: 'slot_tue_p7',
      day: 'Tuesday',
      periodId: 7,
      span: 1,
      courseId: 'c_l2t1_s2',
      customCode: 'ME 266',
      customNickname: '(Thermal Lab)',
      customTeacher: 'Kayes Sir / Team',
      customRoom: 'Heat Transfer Lab',
      customColor: '#ea580c',
    },

    // --- Wednesday ---
    {
      id: 'slot_wed_p2',
      day: 'Wednesday',
      periodId: 2,
      span: 1,
      courseId: 'c_l2t1_3',
      customCode: 'IPE 205',
      customNickname: '(Mfg I)',
      customTeacher: 'AHS Sir',
      customRoom: 'Room: IPE 317',
      customColor: '#2563eb',
    },
    {
      id: 'slot_wed_p3',
      day: 'Wednesday',
      periodId: 3,
      span: 1,
      courseId: 'c_l2t1_1',
      customCode: 'ME 243',
      customNickname: '(Solid Mech Tutorial)',
      customTeacher: "SA Ma'am",
      customRoom: 'Room: IPE 317',
      customColor: '#dc2626',
    },
    {
      id: 'slot_wed_p4',
      day: 'Wednesday',
      periodId: 4,
      span: 1,
      courseId: 'c_l2t1_2',
      customCode: 'ME 265',
      customNickname: '(Thermal Engg Tutorial)',
      customTeacher: 'Kayes Sir',
      customRoom: 'Room: IPE 317',
      customColor: '#ea580c',
    },
  ],
};

// Database initialization (Never force dummy data on first launch)
export async function initializeDatabase(): Promise<void> {
  // Fresh launches start blank and prompt the student through the Onboarding Wizard.
  // Sample seed data is only populated if the user explicitly requests it.
}

// Full Database Export and Import
export async function exportDatabaseJSON(): Promise<string> {
  const courses = await db.courses.toArray();
  const routines = await db.routines.toArray();
  const settings = await db.settings.toArray();

  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    system: 'BUETracker',
    courses,
    routines,
    settings: settings[0] || SEED_SETTINGS,
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importDatabaseJSON(jsonStr: string): Promise<boolean> {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.courses || !Array.isArray(data.courses)) {
      throw new Error('Invalid BUETracker backup file format');
    }

    await db.transaction('rw', db.courses, db.routines, db.settings, async () => {
      await db.courses.clear();
      await db.routines.clear();
      await db.settings.clear();

      await db.courses.bulkAdd(data.courses);
      if (data.routines && Array.isArray(data.routines)) {
        await db.routines.bulkAdd(data.routines);
      }
      if (data.settings) {
        await db.settings.add({ id: 'primary_settings', ...data.settings });
      }
    });

    return true;
  } catch (err) {
    console.error('Import error:', err);
    return false;
  }
}

