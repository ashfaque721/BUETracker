import { Course, RoutineMetadata, RoutineSlot, SemesterInfo } from '../types';

export interface CurriculumCourseDef {
  code: string;
  title: string;
  nickname: string;
  credits: number;
  type: 'theory' | 'sessional';
  teacher?: string;
  room?: string;
  color: string;
}

export interface SemesterCurriculum {
  semesterId: string;
  level: number;
  term: number;
  label: string;
  shortLabel: string;
  totalCredits: number;
  courses: CurriculumCourseDef[];
  routineSlots: RoutineSlot[];
}

/**
 * Official BUET Department of Industrial & Production Engineering (IPE)
 * Undergraduate Course Structure — Sixth Edition Curriculum (Aug 2022)
 * Full 8-Semester (Level 1-4, Term I-II) Term-Wise Course Registry and Schedules
 */
export const IPE_CURRICULUM_DATA: Record<string, SemesterCurriculum> = {
  // ---------------------------------------------------------------------------
  // LEVEL 1 TERM I (20.25 Credits)
  // ---------------------------------------------------------------------------
  L1T1: {
    semesterId: 'L1T1',
    level: 1,
    term: 1,
    label: 'Level-1 Term-1',
    shortLabel: 'L-1 T-1',
    totalCredits: 20.25,
    courses: [
      {
        code: 'PHY 117',
        title: 'Structure of Matter, Electricity and Magnetism, and Modern Physics',
        nickname: 'Modern Physics',
        credits: 3.0,
        type: 'theory',
        teacher: 'MI Sir',
        color: '#8b5cf6',
      },
      {
        code: 'CHEM 119',
        title: 'Chemistry - I',
        nickname: 'Chemistry I',
        credits: 3.0,
        type: 'theory',
        teacher: 'FK Sir',
        color: '#06b6d4',
      },
      {
        code: 'MATH 191',
        title: 'Differential and Integral Calculus',
        nickname: 'Calculus',
        credits: 4.0,
        type: 'theory',
        teacher: 'SA Sir',
        color: '#3b82f6',
      },
      {
        code: 'HUM 211',
        title: 'Sociology',
        nickname: 'Sociology',
        credits: 2.0,
        type: 'theory',
        teacher: 'RH Sir',
        color: '#ec4899',
      },
      {
        code: 'IPE 105',
        title: 'Principles of Cost and Management Accounting',
        nickname: 'Cost & Mgmt Acct',
        credits: 3.0,
        type: 'theory',
        teacher: 'AHS Sir',
        color: '#10b981',
      },
      {
        code: 'ME 160',
        title: 'Mechanical Engineering Drawing - I',
        nickname: 'Drawing Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'Drawing Team',
        color: '#f59e0b',
      },
      {
        code: 'SHOP 170',
        title: 'Machine Shop',
        nickname: 'Machine Shop',
        credits: 0.75,
        type: 'sessional',
        teacher: 'Shop Inst.',
        color: '#64748b',
      },
      {
        code: 'CHEM 114',
        title: 'Inorganic Quantitative Analysis Sessional',
        nickname: 'Chem Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'Chem Team',
        color: '#06b6d4',
      },
      {
        code: 'HUM 102',
        title: 'English Language Practice',
        nickname: 'English Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'Lang Inst.',
        color: '#ec4899',
      },
    ],
    routineSlots: [
      // Saturday
      { id: 'l1t1_sat_p1', day: 'Saturday', periodId: 1, span: 1, customCode: 'MATH 191', customNickname: 'Calculus', customTeacher: 'SA Sir' },
      { id: 'l1t1_sat_p2', day: 'Saturday', periodId: 2, span: 1, customCode: 'CHEM 119', customNickname: 'Chemistry I', customTeacher: 'FK Sir' },
      { id: 'l1t1_sat_p3', day: 'Saturday', periodId: 3, span: 1, customCode: 'PHY 117', customNickname: 'Modern Physics', customTeacher: 'MI Sir' },
      { id: 'l1t1_sat_p7', day: 'Saturday', periodId: 7, span: 1, customCode: 'ME 160', customNickname: 'Drawing Lab', customTeacher: 'Drawing Team' },
      // Sunday
      { id: 'l1t1_sun_p1', day: 'Sunday', periodId: 1, span: 1, customCode: 'IPE 105', customNickname: 'Cost & Mgmt Acct', customTeacher: 'AHS Sir' },
      { id: 'l1t1_sun_p2', day: 'Sunday', periodId: 2, span: 1, customCode: 'MATH 191', customNickname: 'Calculus', customTeacher: 'SA Sir' },
      { id: 'l1t1_sun_p3', day: 'Sunday', periodId: 3, span: 1, customCode: 'HUM 211', customNickname: 'Sociology', customTeacher: 'RH Sir' },
      { id: 'l1t1_sun_p7', day: 'Sunday', periodId: 7, span: 1, customCode: 'CHEM 114', customNickname: 'Chem Lab', customTeacher: 'Chem Team' },
      // Monday
      { id: 'l1t1_mon_p1', day: 'Monday', periodId: 1, span: 1, customCode: 'PHY 117', customNickname: 'Modern Physics', customTeacher: 'MI Sir' },
      { id: 'l1t1_mon_p2', day: 'Monday', periodId: 2, span: 1, customCode: 'CHEM 119', customNickname: 'Chemistry I', customTeacher: 'FK Sir' },
      { id: 'l1t1_mon_p3', day: 'Monday', periodId: 3, span: 1, customCode: 'IPE 105', customNickname: 'Cost & Mgmt Acct', customTeacher: 'AHS Sir' },
      { id: 'l1t1_mon_p7', day: 'Monday', periodId: 7, span: 1, customCode: 'SHOP 170', customNickname: 'Machine Shop', customTeacher: 'Shop Inst.' },
      // Tuesday
      { id: 'l1t1_tue_p1', day: 'Tuesday', periodId: 1, span: 1, customCode: 'MATH 191', customNickname: 'Calculus', customTeacher: 'SA Sir' },
      { id: 'l1t1_tue_p2', day: 'Tuesday', periodId: 2, span: 1, customCode: 'PHY 117', customNickname: 'Modern Physics', customTeacher: 'MI Sir' },
      { id: 'l1t1_tue_p3', day: 'Tuesday', periodId: 3, span: 1, customCode: 'HUM 211', customNickname: 'Sociology', customTeacher: 'RH Sir' },
      { id: 'l1t1_tue_p7', day: 'Tuesday', periodId: 7, span: 1, customCode: 'HUM 102', customNickname: 'English Lab', customTeacher: 'Lang Inst.' },
      // Wednesday
      { id: 'l1t1_wed_p1', day: 'Wednesday', periodId: 1, span: 1, customCode: 'MATH 191', customNickname: 'Calculus', customTeacher: 'SA Sir' },
      { id: 'l1t1_wed_p2', day: 'Wednesday', periodId: 2, span: 1, customCode: 'CHEM 119', customNickname: 'Chemistry I', customTeacher: 'FK Sir' },
      { id: 'l1t1_wed_p3', day: 'Wednesday', periodId: 3, span: 1, customCode: 'IPE 105', customNickname: 'Cost & Mgmt Acct', customTeacher: 'AHS Sir' },
    ],
  },

  // ---------------------------------------------------------------------------
  // LEVEL 1 TERM II (21.25 Credits)
  // ---------------------------------------------------------------------------
  L1T2: {
    semesterId: 'L1T2',
    level: 1,
    term: 2,
    label: 'Level-1 Term-2',
    shortLabel: 'L-1 T-2',
    totalCredits: 21.25,
    courses: [
      {
        code: 'MATH 193',
        title: 'Vector, Matrix and Solid Geometry',
        nickname: 'Vectors & Matrices',
        credits: 4.0,
        type: 'theory',
        teacher: 'Math Faculty',
        color: '#3b82f6',
      },
      {
        code: 'PHY 163',
        title: 'Waves and Oscillations, Physical Optics and Wave Mechanics',
        nickname: 'Optics & Waves',
        credits: 3.0,
        type: 'theory',
        teacher: 'Phy Faculty',
        color: '#8b5cf6',
      },
      {
        code: 'CHEM 143',
        title: 'Chemistry of Materials',
        nickname: 'Chem of Materials',
        credits: 2.0,
        type: 'theory',
        teacher: 'Chem Faculty',
        color: '#06b6d4',
      },
      {
        code: 'MME 195',
        title: 'Engineering Materials I',
        nickname: 'Engg Materials I',
        credits: 3.0,
        type: 'theory',
        teacher: 'MME Faculty',
        color: '#f97316',
      },
      {
        code: 'EEE 167',
        title: 'Basic Electrical & Electronic Circuit',
        nickname: 'Electrical Circuit',
        credits: 4.0,
        type: 'theory',
        teacher: 'EEE Faculty',
        color: '#eab308',
      },
      {
        code: 'IPE 104',
        title: 'Engineering Graphics',
        nickname: 'Graphics Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'Graphics Team',
        color: '#10b981',
      },
      {
        code: 'PHY 102',
        title: 'Physics Sessional',
        nickname: 'Physics Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'Phy Team',
        color: '#8b5cf6',
      },
      {
        code: 'EEE 168',
        title: 'Basic Electrical & Electronic Circuit Sessional',
        nickname: 'EEE Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'EEE Team',
        color: '#eab308',
      },
      {
        code: 'SHOP 160',
        title: 'Foundry and Welding Shop',
        nickname: 'Foundry & Welding',
        credits: 0.75,
        type: 'sessional',
        teacher: 'Shop Inst.',
        color: '#64748b',
      },
    ],
    routineSlots: [
      // Saturday
      { id: 'l1t2_sat_p1', day: 'Saturday', periodId: 1, span: 1, customCode: 'MATH 193', customNickname: 'Vectors & Matrices', customTeacher: 'Math Faculty' },
      { id: 'l1t2_sat_p2', day: 'Saturday', periodId: 2, span: 1, customCode: 'PHY 163', customNickname: 'Optics & Waves', customTeacher: 'Phy Faculty' },
      { id: 'l1t2_sat_p3', day: 'Saturday', periodId: 3, span: 1, customCode: 'MME 195', customNickname: 'Engg Materials I', customTeacher: 'MME Faculty' },
      { id: 'l1t2_sat_p7', day: 'Saturday', periodId: 7, span: 1, customCode: 'IPE 104', customNickname: 'Graphics Lab', customTeacher: 'Graphics Team' },
      // Sunday
      { id: 'l1t2_sun_p1', day: 'Sunday', periodId: 1, span: 1, customCode: 'EEE 167', customNickname: 'Electrical Circuit', customTeacher: 'EEE Faculty' },
      { id: 'l1t2_sun_p2', day: 'Sunday', periodId: 2, span: 1, customCode: 'MATH 193', customNickname: 'Vectors & Matrices', customTeacher: 'Math Faculty' },
      { id: 'l1t2_sun_p3', day: 'Sunday', periodId: 3, span: 1, customCode: 'CHEM 143', customNickname: 'Chem of Materials', customTeacher: 'Chem Faculty' },
      { id: 'l1t2_sun_p7', day: 'Sunday', periodId: 7, span: 1, customCode: 'PHY 102', customNickname: 'Physics Lab', customTeacher: 'Phy Team' },
      // Monday
      { id: 'l1t2_mon_p1', day: 'Monday', periodId: 1, span: 1, customCode: 'PHY 163', customNickname: 'Optics & Waves', customTeacher: 'Phy Faculty' },
      { id: 'l1t2_mon_p2', day: 'Monday', periodId: 2, span: 1, customCode: 'EEE 167', customNickname: 'Electrical Circuit', customTeacher: 'EEE Faculty' },
      { id: 'l1t2_mon_p3', day: 'Monday', periodId: 3, span: 1, customCode: 'MME 195', customNickname: 'Engg Materials I', customTeacher: 'MME Faculty' },
      { id: 'l1t2_mon_p7', day: 'Monday', periodId: 7, span: 1, customCode: 'EEE 168', customNickname: 'EEE Lab', customTeacher: 'EEE Team' },
      // Tuesday
      { id: 'l1t2_tue_p1', day: 'Tuesday', periodId: 1, span: 1, customCode: 'MATH 193', customNickname: 'Vectors & Matrices', customTeacher: 'Math Faculty' },
      { id: 'l1t2_tue_p2', day: 'Tuesday', periodId: 2, span: 1, customCode: 'CHEM 143', customNickname: 'Chem of Materials', customTeacher: 'Chem Faculty' },
      { id: 'l1t2_tue_p3', day: 'Tuesday', periodId: 3, span: 1, customCode: 'EEE 167', customNickname: 'Electrical Circuit', customTeacher: 'EEE Faculty' },
      { id: 'l1t2_tue_p7', day: 'Tuesday', periodId: 7, span: 1, customCode: 'SHOP 160', customNickname: 'Foundry & Welding', customTeacher: 'Shop Inst.' },
      // Wednesday
      { id: 'l1t2_wed_p1', day: 'Wednesday', periodId: 1, span: 1, customCode: 'MATH 193', customNickname: 'Vectors & Matrices', customTeacher: 'Math Faculty' },
      { id: 'l1t2_wed_p2', day: 'Wednesday', periodId: 2, span: 1, customCode: 'PHY 163', customNickname: 'Optics & Waves', customTeacher: 'Phy Faculty' },
      { id: 'l1t2_wed_p3', day: 'Wednesday', periodId: 3, span: 1, customCode: 'MME 195', customNickname: 'Engg Materials I', customTeacher: 'MME Faculty' },
    ],
  },

  // ---------------------------------------------------------------------------
  // LEVEL 2 TERM I (21.00 Credits)
  // ---------------------------------------------------------------------------
  L2T1: {
    semesterId: 'L2T1',
    level: 2,
    term: 1,
    label: 'Level-2 Term-1',
    shortLabel: 'L-2 T-1',
    totalCredits: 21.00,
    courses: [
      {
        code: 'MATH 291',
        title: 'Differential Equation, Vector Calculus and Laplace Transform',
        nickname: 'Differential Eqn',
        credits: 3.0,
        type: 'theory',
        teacher: 'Math Faculty',
        color: '#3b82f6',
      },
      {
        code: 'EEE 271',
        title: 'Electrical Machines and Electronics',
        nickname: 'Machines & Electronics',
        credits: 3.0,
        type: 'theory',
        teacher: 'EEE Faculty',
        color: '#eab308',
      },
      {
        code: 'MME 295',
        title: 'Engineering Materials II',
        nickname: 'Engg Materials II',
        credits: 2.0,
        type: 'theory',
        teacher: 'MME Faculty',
        color: '#f97316',
      },
      {
        code: 'CSE 295',
        title: 'Computer Programming Techniques',
        nickname: 'Programming (C++)',
        credits: 3.0,
        type: 'theory',
        teacher: 'CSE Faculty',
        color: '#06b6d4',
      },
      {
        code: 'ME 245',
        title: 'Engineering Mechanics and Theory of Machines',
        nickname: 'Mechanics & Machines',
        credits: 4.0,
        type: 'theory',
        teacher: 'ME Faculty',
        color: '#dc2626',
      },
      {
        code: 'EEE 272',
        title: 'Electrical Machines and Electronics Sessional',
        nickname: 'Machines Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'EEE Team',
        color: '#eab308',
      },
      {
        code: 'MME 296',
        title: 'Engineering Materials Sessional',
        nickname: 'Materials Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'MME Team',
        color: '#f97316',
      },
      {
        code: 'CSE 296',
        title: 'Computer Programming Techniques Sessional',
        nickname: 'Programming Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'CSE Team',
        color: '#06b6d4',
      },
      {
        code: 'IPE 204',
        title: 'Engineering Graphics and Introduction to CAD Sessional',
        nickname: 'CAD Sessional',
        credits: 1.5,
        type: 'sessional',
        teacher: 'CAD Team',
        color: '#10b981',
      },
    ],
    routineSlots: [
      // Saturday
      { id: 'l2t1_sat_p1', day: 'Saturday', periodId: 1, span: 1, customCode: 'MATH 291', customNickname: 'Differential Eqn', customTeacher: 'Math Faculty' },
      { id: 'l2t1_sat_p2', day: 'Saturday', periodId: 2, span: 1, customCode: 'ME 245', customNickname: 'Mechanics & Machines', customTeacher: 'ME Faculty' },
      { id: 'l2t1_sat_p3', day: 'Saturday', periodId: 3, span: 1, customCode: 'CSE 295', customNickname: 'Programming (C++)', customTeacher: 'CSE Faculty' },
      { id: 'l2t1_sat_p7', day: 'Saturday', periodId: 7, span: 1, customCode: 'EEE 272', customNickname: 'Machines Lab', customTeacher: 'EEE Team' },
      // Sunday
      { id: 'l2t1_sun_p1', day: 'Sunday', periodId: 1, span: 1, customCode: 'EEE 271', customNickname: 'Machines & Electronics', customTeacher: 'EEE Faculty' },
      { id: 'l2t1_sun_p2', day: 'Sunday', periodId: 2, span: 1, customCode: 'MME 295', customNickname: 'Engg Materials II', customTeacher: 'MME Faculty' },
      { id: 'l2t1_sun_p3', day: 'Sunday', periodId: 3, span: 1, customCode: 'ME 245', customNickname: 'Mechanics & Machines', customTeacher: 'ME Faculty' },
      { id: 'l2t1_sun_p7', day: 'Sunday', periodId: 7, span: 1, customCode: 'MME 296', customNickname: 'Materials Lab', customTeacher: 'MME Team' },
      // Monday
      { id: 'l2t1_mon_p1', day: 'Monday', periodId: 1, span: 1, customCode: 'MATH 291', customNickname: 'Differential Eqn', customTeacher: 'Math Faculty' },
      { id: 'l2t1_mon_p2', day: 'Monday', periodId: 2, span: 1, customCode: 'CSE 295', customNickname: 'Programming (C++)', customTeacher: 'CSE Faculty' },
      { id: 'l2t1_mon_p3', day: 'Monday', periodId: 3, span: 1, customCode: 'EEE 271', customNickname: 'Machines & Electronics', customTeacher: 'EEE Faculty' },
      { id: 'l2t1_mon_p7', day: 'Monday', periodId: 7, span: 1, customCode: 'CSE 296', customNickname: 'Programming Lab', customTeacher: 'CSE Team' },
      // Tuesday
      { id: 'l2t1_tue_p1', day: 'Tuesday', periodId: 1, span: 1, customCode: 'ME 245', customNickname: 'Mechanics & Machines', customTeacher: 'ME Faculty' },
      { id: 'l2t1_tue_p2', day: 'Tuesday', periodId: 2, span: 1, customCode: 'MME 295', customNickname: 'Engg Materials II', customTeacher: 'MME Faculty' },
      { id: 'l2t1_tue_p3', day: 'Tuesday', periodId: 3, span: 1, customCode: 'MATH 291', customNickname: 'Differential Eqn', customTeacher: 'Math Faculty' },
      { id: 'l2t1_tue_p7', day: 'Tuesday', periodId: 7, span: 1, customCode: 'IPE 204', customNickname: 'CAD Sessional', customTeacher: 'CAD Team' },
      // Wednesday
      { id: 'l2t1_wed_p1', day: 'Wednesday', periodId: 1, span: 1, customCode: 'CSE 295', customNickname: 'Programming (C++)', customTeacher: 'CSE Faculty' },
      { id: 'l2t1_wed_p2', day: 'Wednesday', periodId: 2, span: 1, customCode: 'EEE 271', customNickname: 'Machines & Electronics', customTeacher: 'EEE Faculty' },
      { id: 'l2t1_wed_p3', day: 'Wednesday', periodId: 3, span: 1, customCode: 'ME 245', customNickname: 'Mechanics & Machines', customTeacher: 'ME Faculty' },
    ],
  },

  // ---------------------------------------------------------------------------
  // LEVEL 2 TERM II (19.00 Credits)
  // ---------------------------------------------------------------------------
  L2T2: {
    semesterId: 'L2T2',
    level: 2,
    term: 2,
    label: 'Level-2 Term-2',
    shortLabel: 'L-2 T-2',
    totalCredits: 19.00,
    courses: [
      {
        code: 'IPE 205',
        title: 'Manufacturing Processes I',
        nickname: 'Mfg Processes I',
        credits: 3.0,
        type: 'theory',
        teacher: 'AHS Sir',
        color: '#10b981',
      },
      {
        code: 'IPE 207',
        title: 'Probability and Statistics',
        nickname: 'Probability & Stats',
        credits: 4.0,
        type: 'theory',
        teacher: 'Kayes Sir',
        color: '#3b82f6',
      },
      {
        code: 'IPE 209',
        title: 'Engineering Economy',
        nickname: 'Engg Economy',
        credits: 2.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#ec4899',
      },
      {
        code: 'ME 243',
        title: 'Mechanics of Solids',
        nickname: 'Solid Mech',
        credits: 3.0,
        type: 'theory',
        teacher: "SA Ma'am",
        color: '#dc2626',
      },
      {
        code: 'ME 265',
        title: 'Thermodynamics and Heat Transfer',
        nickname: 'Thermo & Heat',
        credits: 4.0,
        type: 'theory',
        teacher: 'ME Faculty',
        color: '#f97316',
      },
      {
        code: 'IPE 206',
        title: 'Manufacturing Processes I Sessional',
        nickname: 'Mfg I Lab',
        credits: 0.75,
        type: 'sessional',
        teacher: 'AHS Sir / Inst.',
        color: '#10b981',
      },
      {
        code: 'ME 244',
        title: 'Mechanics of Solids Sessional',
        nickname: 'Solids Lab',
        credits: 0.75,
        type: 'sessional',
        teacher: "SA Ma'am / Team",
        color: '#dc2626',
      },
      {
        code: 'ME 266',
        title: 'Thermodynamics and Heat Transfer Sessional',
        nickname: 'Thermo Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'Kayes Sir / Team',
        color: '#f97316',
      },
    ],
    routineSlots: [
      // Saturday
      { id: 'l2t2_sat_p1', day: 'Saturday', periodId: 1, span: 1, customCode: 'ME 243', customNickname: 'Solid Mech', customTeacher: "SA Ma'am" },
      { id: 'l2t2_sat_p2', day: 'Saturday', periodId: 2, span: 1, customCode: 'IPE 207', customNickname: 'Probability & Stats', customTeacher: 'Kayes Sir' },
      { id: 'l2t2_sat_p3', day: 'Saturday', periodId: 3, span: 1, customCode: 'ME 265', customNickname: 'Thermo & Heat', customTeacher: 'ME Faculty' },
      { id: 'l2t2_sat_p7', day: 'Saturday', periodId: 7, span: 1, customCode: 'IPE 206', customNickname: 'Mfg I Lab', customTeacher: 'AHS Sir / Inst.' },
      // Sunday
      { id: 'l2t2_sun_p1', day: 'Sunday', periodId: 1, span: 1, customCode: 'IPE 205', customNickname: 'Mfg Processes I', customTeacher: 'AHS Sir' },
      { id: 'l2t2_sun_p2', day: 'Sunday', periodId: 2, span: 1, customCode: 'IPE 209', customNickname: 'Engg Economy', customTeacher: 'IPE Faculty' },
      { id: 'l2t2_sun_p3', day: 'Sunday', periodId: 3, span: 1, customCode: 'ME 265', customNickname: 'Thermo & Heat', customTeacher: 'ME Faculty' },
      { id: 'l2t2_sun_p7', day: 'Sunday', periodId: 7, span: 1, customCode: 'ME 244', customNickname: 'Solids Lab', customTeacher: "SA Ma'am / Team" },
      // Monday
      { id: 'l2t2_mon_p1', day: 'Monday', periodId: 1, span: 1, customCode: 'IPE 207', customNickname: 'Probability & Stats', customTeacher: 'Kayes Sir' },
      { id: 'l2t2_mon_p2', day: 'Monday', periodId: 2, span: 1, customCode: 'ME 243', customNickname: 'Solid Mech', customTeacher: "SA Ma'am" },
      { id: 'l2t2_mon_p3', day: 'Monday', periodId: 3, span: 1, customCode: 'IPE 205', customNickname: 'Mfg Processes I', customTeacher: 'AHS Sir' },
      { id: 'l2t2_mon_p7', day: 'Monday', periodId: 7, span: 1, customCode: 'ME 266', customNickname: 'Thermo Lab', customTeacher: 'Kayes Sir / Team' },
      // Tuesday
      { id: 'l2t2_tue_p1', day: 'Tuesday', periodId: 1, span: 1, customCode: 'ME 265', customNickname: 'Thermo & Heat', customTeacher: 'ME Faculty' },
      { id: 'l2t2_tue_p2', day: 'Tuesday', periodId: 2, span: 1, customCode: 'IPE 207', customNickname: 'Probability & Stats', customTeacher: 'Kayes Sir' },
      { id: 'l2t2_tue_p3', day: 'Tuesday', periodId: 3, span: 1, customCode: 'IPE 209', customNickname: 'Engg Economy', customTeacher: 'IPE Faculty' },
      // Wednesday
      { id: 'l2t2_wed_p1', day: 'Wednesday', periodId: 1, span: 1, customCode: 'ME 243', customNickname: 'Solid Mech', customTeacher: "SA Ma'am" },
      { id: 'l2t2_wed_p2', day: 'Wednesday', periodId: 2, span: 1, customCode: 'IPE 205', customNickname: 'Mfg Processes I', customTeacher: 'AHS Sir' },
      { id: 'l2t2_wed_p3', day: 'Wednesday', periodId: 3, span: 1, customCode: 'IPE 207', customNickname: 'Probability & Stats', customTeacher: 'Kayes Sir' },
    ],
  },

  // ---------------------------------------------------------------------------
  // LEVEL 3 TERM I (16.75 Credits)
  // ---------------------------------------------------------------------------
  L3T1: {
    semesterId: 'L3T1',
    level: 3,
    term: 1,
    label: 'Level-3 Term-1',
    shortLabel: 'L-3 T-1',
    totalCredits: 16.75,
    courses: [
      {
        code: 'ME 223',
        title: 'Fluid Mechanics & Machinery',
        nickname: 'Fluid Mechanics',
        credits: 3.0,
        type: 'theory',
        teacher: 'ME Faculty',
        color: '#06b6d4',
      },
      {
        code: 'IPE 301',
        title: 'Measurement, Instrumentation and Control',
        nickname: 'Instrumentation',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#eab308',
      },
      {
        code: 'HUM 277',
        title: 'Fundamentals of Economics',
        nickname: 'Economics',
        credits: 3.0,
        type: 'theory',
        teacher: 'Hum Faculty',
        color: '#ec4899',
      },
      {
        code: 'IPE 305',
        title: 'Manufacturing Process II',
        nickname: 'Mfg Process II',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#10b981',
      },
      {
        code: 'IPE 307',
        title: 'Operations Research',
        nickname: 'Operations Research',
        credits: 4.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#3b82f6',
      },
      {
        code: 'ME 224',
        title: 'Fluid Mechanics & Machinery Sessional',
        nickname: 'Fluid Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'ME Team',
        color: '#06b6d4',
      },
      {
        code: 'IPE 302',
        title: 'Measurement, Instrumentation and Control Sessional',
        nickname: 'Control Lab',
        credits: 0.75,
        type: 'sessional',
        teacher: 'IPE Team',
        color: '#eab308',
      },
      {
        code: 'IPE 306',
        title: 'Manufacturing Processes II Sessional',
        nickname: 'Mfg II Lab',
        credits: 0.75,
        type: 'sessional',
        teacher: 'IPE Team',
        color: '#10b981',
      },
    ],
    routineSlots: [
      // Saturday
      { id: 'l3t1_sat_p1', day: 'Saturday', periodId: 1, span: 1, customCode: 'IPE 307', customNickname: 'Operations Research', customTeacher: 'IPE Faculty' },
      { id: 'l3t1_sat_p2', day: 'Saturday', periodId: 2, span: 1, customCode: 'ME 223', customNickname: 'Fluid Mechanics', customTeacher: 'ME Faculty' },
      { id: 'l3t1_sat_p3', day: 'Saturday', periodId: 3, span: 1, customCode: 'IPE 301', customNickname: 'Instrumentation', customTeacher: 'IPE Faculty' },
      { id: 'l3t1_sat_p7', day: 'Saturday', periodId: 7, span: 1, customCode: 'ME 224', customNickname: 'Fluid Lab', customTeacher: 'ME Team' },
      // Sunday
      { id: 'l3t1_sun_p1', day: 'Sunday', periodId: 1, span: 1, customCode: 'IPE 305', customNickname: 'Mfg Process II', customTeacher: 'IPE Faculty' },
      { id: 'l3t1_sun_p2', day: 'Sunday', periodId: 2, span: 1, customCode: 'HUM 277', customNickname: 'Economics', customTeacher: 'Hum Faculty' },
      { id: 'l3t1_sun_p3', day: 'Sunday', periodId: 3, span: 1, customCode: 'IPE 307', customNickname: 'Operations Research', customTeacher: 'IPE Faculty' },
      { id: 'l3t1_sun_p7', day: 'Sunday', periodId: 7, span: 1, customCode: 'IPE 302', customNickname: 'Control Lab', customTeacher: 'IPE Team' },
      // Monday
      { id: 'l3t1_mon_p1', day: 'Monday', periodId: 1, span: 1, customCode: 'ME 223', customNickname: 'Fluid Mechanics', customTeacher: 'ME Faculty' },
      { id: 'l3t1_mon_p2', day: 'Monday', periodId: 2, span: 1, customCode: 'IPE 301', customNickname: 'Instrumentation', customTeacher: 'IPE Faculty' },
      { id: 'l3t1_mon_p3', day: 'Monday', periodId: 3, span: 1, customCode: 'IPE 305', customNickname: 'Mfg Process II', customTeacher: 'IPE Faculty' },
      { id: 'l3t1_mon_p7', day: 'Monday', periodId: 7, span: 1, customCode: 'IPE 306', customNickname: 'Mfg II Lab', customTeacher: 'IPE Team' },
      // Tuesday
      { id: 'l3t1_tue_p1', day: 'Tuesday', periodId: 1, span: 1, customCode: 'HUM 277', customNickname: 'Economics', customTeacher: 'Hum Faculty' },
      { id: 'l3t1_tue_p2', day: 'Tuesday', periodId: 2, span: 1, customCode: 'IPE 307', customNickname: 'Operations Research', customTeacher: 'IPE Faculty' },
      { id: 'l3t1_tue_p3', day: 'Tuesday', periodId: 3, span: 1, customCode: 'ME 223', customNickname: 'Fluid Mechanics', customTeacher: 'ME Faculty' },
      // Wednesday
      { id: 'l3t1_wed_p1', day: 'Wednesday', periodId: 1, span: 1, customCode: 'IPE 301', customNickname: 'Instrumentation', customTeacher: 'IPE Faculty' },
      { id: 'l3t1_wed_p2', day: 'Wednesday', periodId: 2, span: 1, customCode: 'IPE 305', customNickname: 'Mfg Process II', customTeacher: 'IPE Faculty' },
      { id: 'l3t1_wed_p3', day: 'Wednesday', periodId: 3, span: 1, customCode: 'IPE 307', customNickname: 'Operations Research', customTeacher: 'IPE Faculty' },
    ],
  },

  // ---------------------------------------------------------------------------
  // LEVEL 3 TERM II (18.50 Credits)
  // ---------------------------------------------------------------------------
  L3T2: {
    semesterId: 'L3T2',
    level: 3,
    term: 2,
    label: 'Level-3 Term-2',
    shortLabel: 'L-3 T-2',
    totalCredits: 18.50,
    courses: [
      {
        code: 'IPE 303',
        title: 'Product Design I',
        nickname: 'Product Design I',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#6366f1',
      },
      {
        code: 'IPE 311',
        title: 'Material Handling and Maintenance Management',
        nickname: 'Material Handling',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#f97316',
      },
      {
        code: 'IPE 315',
        title: 'Operations Management',
        nickname: 'Operations Mgmt',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#10b981',
      },
      {
        code: 'IPE 319',
        title: 'Quality Management',
        nickname: 'Quality Mgmt',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#06b6d4',
      },
      {
        code: 'IPE 329',
        title: 'Numerical Analysis',
        nickname: 'Numerical Analysis',
        credits: 3.0,
        type: 'theory',
        teacher: 'Math Faculty',
        color: '#3b82f6',
      },
      {
        code: 'IPE 304',
        title: 'Product Design I Sessional',
        nickname: 'Design Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'IPE Team',
        color: '#6366f1',
      },
      {
        code: 'IPE 312',
        title: 'Material Handling and Maintenance Management Sessional',
        nickname: 'Handling Lab',
        credits: 0.75,
        type: 'sessional',
        teacher: 'IPE Team',
        color: '#f97316',
      },
      {
        code: 'IPE 320',
        title: 'Quality Management Sessional',
        nickname: 'Quality Lab',
        credits: 0.75,
        type: 'sessional',
        teacher: 'IPE Team',
        color: '#06b6d4',
      },
      {
        code: 'IPE 322',
        title: 'Business Communication Seminar-I',
        nickname: 'Biz Comm Sem I',
        credits: 0.5,
        type: 'sessional',
        teacher: 'IPE Faculty',
        color: '#ec4899',
      },
    ],
    routineSlots: [
      // Saturday
      { id: 'l3t2_sat_p1', day: 'Saturday', periodId: 1, span: 1, customCode: 'IPE 303', customNickname: 'Product Design I', customTeacher: 'IPE Faculty' },
      { id: 'l3t2_sat_p2', day: 'Saturday', periodId: 2, span: 1, customCode: 'IPE 315', customNickname: 'Operations Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l3t2_sat_p3', day: 'Saturday', periodId: 3, span: 1, customCode: 'IPE 329', customNickname: 'Numerical Analysis', customTeacher: 'Math Faculty' },
      { id: 'l3t2_sat_p7', day: 'Saturday', periodId: 7, span: 1, customCode: 'IPE 304', customNickname: 'Design Lab', customTeacher: 'IPE Team' },
      // Sunday
      { id: 'l3t2_sun_p1', day: 'Sunday', periodId: 1, span: 1, customCode: 'IPE 311', customNickname: 'Material Handling', customTeacher: 'IPE Faculty' },
      { id: 'l3t2_sun_p2', day: 'Sunday', periodId: 2, span: 1, customCode: 'IPE 319', customNickname: 'Quality Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l3t2_sun_p3', day: 'Sunday', periodId: 3, span: 1, customCode: 'IPE 303', customNickname: 'Product Design I', customTeacher: 'IPE Faculty' },
      { id: 'l3t2_sun_p7', day: 'Sunday', periodId: 7, span: 1, customCode: 'IPE 312', customNickname: 'Handling Lab', customTeacher: 'IPE Team' },
      // Monday
      { id: 'l3t2_mon_p1', day: 'Monday', periodId: 1, span: 1, customCode: 'IPE 315', customNickname: 'Operations Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l3t2_mon_p2', day: 'Monday', periodId: 2, span: 1, customCode: 'IPE 329', customNickname: 'Numerical Analysis', customTeacher: 'Math Faculty' },
      { id: 'l3t2_mon_p3', day: 'Monday', periodId: 3, span: 1, customCode: 'IPE 311', customNickname: 'Material Handling', customTeacher: 'IPE Faculty' },
      { id: 'l3t2_mon_p7', day: 'Monday', periodId: 7, span: 1, customCode: 'IPE 320', customNickname: 'Quality Lab', customTeacher: 'IPE Team' },
      // Tuesday
      { id: 'l3t2_tue_p1', day: 'Tuesday', periodId: 1, span: 1, customCode: 'IPE 319', customNickname: 'Quality Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l3t2_tue_p2', day: 'Tuesday', periodId: 2, span: 1, customCode: 'IPE 303', customNickname: 'Product Design I', customTeacher: 'IPE Faculty' },
      { id: 'l3t2_tue_p3', day: 'Tuesday', periodId: 3, span: 1, customCode: 'IPE 315', customNickname: 'Operations Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l3t2_tue_p7', day: 'Tuesday', periodId: 7, span: 1, customCode: 'IPE 322', customNickname: 'Biz Comm Sem I', customTeacher: 'IPE Faculty' },
      // Wednesday
      { id: 'l3t2_wed_p1', day: 'Wednesday', periodId: 1, span: 1, customCode: 'IPE 311', customNickname: 'Material Handling', customTeacher: 'IPE Faculty' },
      { id: 'l3t2_wed_p2', day: 'Wednesday', periodId: 2, span: 1, customCode: 'IPE 319', customNickname: 'Quality Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l3t2_wed_p3', day: 'Wednesday', periodId: 3, span: 1, customCode: 'IPE 329', customNickname: 'Numerical Analysis', customTeacher: 'Math Faculty' },
    ],
  },

  // ---------------------------------------------------------------------------
  // LEVEL 4 TERM I (23.25 Credits)
  // ---------------------------------------------------------------------------
  L4T1: {
    semesterId: 'L4T1',
    level: 4,
    term: 1,
    label: 'Level-4 Term-1',
    shortLabel: 'L-4 T-1',
    totalCredits: 23.25,
    courses: [
      {
        code: 'IPE 403',
        title: 'Project and Environmental Management',
        nickname: 'Project & Env Mgmt',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#10b981',
      },
      {
        code: 'IPE 407',
        title: 'Ergonomics and Safety Management',
        nickname: 'Ergonomics & Safety',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#f59e0b',
      },
      {
        code: 'IPE 451',
        title: 'Supply Chain Management',
        nickname: 'Supply Chain',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#3b82f6',
      },
      {
        code: 'IPE 317',
        title: 'Product Design II',
        nickname: 'Product Design II',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#8b5cf6',
      },
      {
        code: 'IPE 421',
        title: 'Machine Learning in Manufacturing (Optional-I)',
        nickname: 'Optional-I',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#06b6d4',
      },
      {
        code: 'IPE 400',
        title: 'Project and Thesis',
        nickname: 'Thesis / Project',
        credits: 3.0,
        type: 'sessional',
        teacher: 'Advisor',
        color: '#ec4899',
      },
      {
        code: 'IPE 408',
        title: 'Ergonomics and Safety Management Sessional',
        nickname: 'Ergo Lab',
        credits: 0.75,
        type: 'sessional',
        teacher: 'IPE Team',
        color: '#f59e0b',
      },
      {
        code: 'IPE 318',
        title: 'Product Design II Sessional',
        nickname: 'Design II Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'IPE Team',
        color: '#8b5cf6',
      },
      {
        code: 'IPE 300',
        title: 'Industrial Practice',
        nickname: 'Industrial Practice',
        credits: 3.0,
        type: 'sessional',
        teacher: 'Faculty / Industry',
        color: '#64748b',
      },
    ],
    routineSlots: [
      // Saturday
      { id: 'l4t1_sat_p1', day: 'Saturday', periodId: 1, span: 1, customCode: 'IPE 403', customNickname: 'Project & Env Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_sat_p2', day: 'Saturday', periodId: 2, span: 1, customCode: 'IPE 407', customNickname: 'Ergonomics & Safety', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_sat_p3', day: 'Saturday', periodId: 3, span: 1, customCode: 'IPE 451', customNickname: 'Supply Chain', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_sat_p7', day: 'Saturday', periodId: 7, span: 1, customCode: 'IPE 408', customNickname: 'Ergo Lab', customTeacher: 'IPE Team' },
      // Sunday
      { id: 'l4t1_sun_p1', day: 'Sunday', periodId: 1, span: 1, customCode: 'IPE 317', customNickname: 'Product Design II', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_sun_p2', day: 'Sunday', periodId: 2, span: 1, customCode: 'IPE 421', customNickname: 'Optional-I', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_sun_p3', day: 'Sunday', periodId: 3, span: 1, customCode: 'IPE 403', customNickname: 'Project & Env Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_sun_p7', day: 'Sunday', periodId: 7, span: 1, customCode: 'IPE 318', customNickname: 'Design II Lab', customTeacher: 'IPE Team' },
      // Monday
      { id: 'l4t1_mon_p1', day: 'Monday', periodId: 1, span: 1, customCode: 'IPE 407', customNickname: 'Ergonomics & Safety', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_mon_p2', day: 'Monday', periodId: 2, span: 1, customCode: 'IPE 451', customNickname: 'Supply Chain', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_mon_p3', day: 'Monday', periodId: 3, span: 1, customCode: 'IPE 317', customNickname: 'Product Design II', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_mon_p7', day: 'Monday', periodId: 7, span: 1, customCode: 'IPE 400', customNickname: 'Thesis / Project', customTeacher: 'Advisor' },
      // Tuesday
      { id: 'l4t1_tue_p1', day: 'Tuesday', periodId: 1, span: 1, customCode: 'IPE 421', customNickname: 'Optional-I', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_tue_p2', day: 'Tuesday', periodId: 2, span: 1, customCode: 'IPE 403', customNickname: 'Project & Env Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_tue_p3', day: 'Tuesday', periodId: 3, span: 1, customCode: 'IPE 407', customNickname: 'Ergonomics & Safety', customTeacher: 'IPE Faculty' },
      // Wednesday
      { id: 'l4t1_wed_p1', day: 'Wednesday', periodId: 1, span: 1, customCode: 'IPE 451', customNickname: 'Supply Chain', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_wed_p2', day: 'Wednesday', periodId: 2, span: 1, customCode: 'IPE 317', customNickname: 'Product Design II', customTeacher: 'IPE Faculty' },
      { id: 'l4t1_wed_p3', day: 'Wednesday', periodId: 3, span: 1, customCode: 'IPE 421', customNickname: 'Optional-I', customTeacher: 'IPE Faculty' },
    ],
  },

  // ---------------------------------------------------------------------------
  // LEVEL 4 TERM II (20.25 Credits)
  // ---------------------------------------------------------------------------
  L4T2: {
    semesterId: 'L4T2',
    level: 4,
    term: 2,
    label: 'Level-4 Term-2',
    shortLabel: 'L-4 T-2',
    totalCredits: 20.25,
    courses: [
      {
        code: 'IPE 401',
        title: 'Machine Tools',
        nickname: 'Machine Tools',
        credits: 4.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#dc2626',
      },
      {
        code: 'IPE 409',
        title: 'CAD/CAM',
        nickname: 'CAD/CAM',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#06b6d4',
      },
      {
        code: 'IPE 411',
        title: 'Industrial and Business Management',
        nickname: 'Industrial & Biz Mgmt',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#10b981',
      },
      {
        code: 'IPE 423',
        title: 'Quality Tools and Six Sigma (Optional II)',
        nickname: 'Optional II',
        credits: 3.0,
        type: 'theory',
        teacher: 'IPE Faculty',
        color: '#8b5cf6',
      },
      {
        code: 'IPE 400',
        title: 'Project and Thesis',
        nickname: 'Thesis Defense',
        credits: 3.0,
        type: 'sessional',
        teacher: 'Advisor',
        color: '#ec4899',
      },
      {
        code: 'IPE 402',
        title: 'Machine Tools Sessional',
        nickname: 'Machine Tools Lab',
        credits: 1.5,
        type: 'sessional',
        teacher: 'IPE Team',
        color: '#dc2626',
      },
      {
        code: 'IPE 410',
        title: 'CAD/CAM Sessional',
        nickname: 'CAD/CAM Lab',
        credits: 0.75,
        type: 'sessional',
        teacher: 'IPE Team',
        color: '#06b6d4',
      },
      {
        code: 'IPE 470',
        title: 'Industrial Simulation Sessional',
        nickname: 'Simulation Lab',
        credits: 0.75,
        type: 'sessional',
        teacher: 'IPE Team',
        color: '#f97316',
      },
      {
        code: 'IPE 480',
        title: 'Business Communication Seminar II',
        nickname: 'Biz Comm Sem II',
        credits: 0.5,
        type: 'sessional',
        teacher: 'IPE Faculty',
        color: '#eab308',
      },
    ],
    routineSlots: [
      // Saturday
      { id: 'l4t2_sat_p1', day: 'Saturday', periodId: 1, span: 1, customCode: 'IPE 401', customNickname: 'Machine Tools', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_sat_p2', day: 'Saturday', periodId: 2, span: 1, customCode: 'IPE 409', customNickname: 'CAD/CAM', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_sat_p3', day: 'Saturday', periodId: 3, span: 1, customCode: 'IPE 411', customNickname: 'Industrial & Biz Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_sat_p7', day: 'Saturday', periodId: 7, span: 1, customCode: 'IPE 402', customNickname: 'Machine Tools Lab', customTeacher: 'IPE Team' },
      // Sunday
      { id: 'l4t2_sun_p1', day: 'Sunday', periodId: 1, span: 1, customCode: 'IPE 423', customNickname: 'Optional II', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_sun_p2', day: 'Sunday', periodId: 2, span: 1, customCode: 'IPE 401', customNickname: 'Machine Tools', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_sun_p3', day: 'Sunday', periodId: 3, span: 1, customCode: 'IPE 409', customNickname: 'CAD/CAM', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_sun_p7', day: 'Sunday', periodId: 7, span: 1, customCode: 'IPE 410', customNickname: 'CAD/CAM Lab', customTeacher: 'IPE Team' },
      // Monday
      { id: 'l4t2_mon_p1', day: 'Monday', periodId: 1, span: 1, customCode: 'IPE 411', customNickname: 'Industrial & Biz Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_mon_p2', day: 'Monday', periodId: 2, span: 1, customCode: 'IPE 423', customNickname: 'Optional II', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_mon_p3', day: 'Monday', periodId: 3, span: 1, customCode: 'IPE 401', customNickname: 'Machine Tools', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_mon_p7', day: 'Monday', periodId: 7, span: 1, customCode: 'IPE 470', customNickname: 'Simulation Lab', customTeacher: 'IPE Team' },
      // Tuesday
      { id: 'l4t2_tue_p1', day: 'Tuesday', periodId: 1, span: 1, customCode: 'IPE 409', customNickname: 'CAD/CAM', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_tue_p2', day: 'Tuesday', periodId: 2, span: 1, customCode: 'IPE 411', customNickname: 'Industrial & Biz Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_tue_p3', day: 'Tuesday', periodId: 3, span: 1, customCode: 'IPE 401', customNickname: 'Machine Tools', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_tue_p7', day: 'Tuesday', periodId: 7, span: 1, customCode: 'IPE 480', customNickname: 'Biz Comm Sem II', customTeacher: 'IPE Faculty' },
      // Wednesday
      { id: 'l4t2_wed_p1', day: 'Wednesday', periodId: 1, span: 1, customCode: 'IPE 423', customNickname: 'Optional II', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_wed_p2', day: 'Wednesday', periodId: 2, span: 1, customCode: 'IPE 409', customNickname: 'CAD/CAM', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_wed_p3', day: 'Wednesday', periodId: 3, span: 1, customCode: 'IPE 411', customNickname: 'Industrial & Biz Mgmt', customTeacher: 'IPE Faculty' },
      { id: 'l4t2_wed_p7', day: 'Wednesday', periodId: 7, span: 1, customCode: 'IPE 400', customNickname: 'Thesis Defense', customTeacher: 'Advisor' },
    ],
  },
};

const STANDARD_GRADE_MAP: Record<string, { grade: string; gradePoint: number }> = {
  'MATH 191': { grade: 'A+', gradePoint: 4.0 },
  'PHY 117': { grade: 'A', gradePoint: 3.75 },
  'CHEM 119': { grade: 'A-', gradePoint: 3.5 },
  'HUM 211': { grade: 'A+', gradePoint: 4.0 },
  'IPE 105': { grade: 'A', gradePoint: 3.75 },
  'ME 160': { grade: 'A+', gradePoint: 4.0 },
  'SHOP 170': { grade: 'A+', gradePoint: 4.0 },
  'PHY 102': { grade: 'A+', gradePoint: 4.0 },
  'CHEM 114': { grade: 'A', gradePoint: 3.75 },

  'MATH 193': { grade: 'A+', gradePoint: 4.0 },
  'CHEM 123': { grade: 'A', gradePoint: 3.75 },
  'EEE 167': { grade: 'A-', gradePoint: 3.5 },
  'ME 141': { grade: 'A+', gradePoint: 4.0 },
  'IPE 101': { grade: 'A', gradePoint: 3.75 },
  'PHY 118': { grade: 'A+', gradePoint: 4.0 },
  'EEE 168': { grade: 'A', gradePoint: 3.75 },
  'SHOP 160': { grade: 'A+', gradePoint: 4.0 },
  'IPE 104': { grade: 'A+', gradePoint: 4.0 },

  'MATH 291': { grade: 'A+', gradePoint: 4.0 },
  'EEE 271': { grade: 'A', gradePoint: 3.75 },
  'MME 295': { grade: 'A', gradePoint: 3.75 },
  'CSE 295': { grade: 'A+', gradePoint: 4.0 },
  'ME 245': { grade: 'A-', gradePoint: 3.5 },
  'EEE 272': { grade: 'A', gradePoint: 3.75 },
  'MME 296': { grade: 'A+', gradePoint: 4.0 },
  'CSE 296': { grade: 'A+', gradePoint: 4.0 },
  'IPE 204': { grade: 'A+', gradePoint: 4.0 },
};

/**
 * Creates Course objects for a given semester based on the IPE Curriculum
 */
export function getIpeCoursesForSemester(semesterId: string, isOngoing: boolean = true): Course[] {
  const curr = IPE_CURRICULUM_DATA[semesterId] || IPE_CURRICULUM_DATA.L2T1;
  return curr.courses.map((c, idx) => {
    const courseId = `c_${semesterId}_${c.code.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const standardGrade = STANDARD_GRADE_MAP[c.code] || (
      c.type === 'sessional'
        ? { grade: 'A+', gradePoint: 4.0 }
        : idx % 2 === 0
        ? { grade: 'A+', gradePoint: 4.0 }
        : { grade: 'A', gradePoint: 3.75 }
    );

    const baseCourse: Course = {
      id: courseId,
      code: c.code,
      title: c.title,
      nickname: c.nickname,
      credits: c.credits,
      type: c.type,
      semesterId: semesterId,
      teacher: c.teacher,
      room: c.room,
      color: c.color,
      isOngoing: isOngoing,
      grade: isOngoing ? undefined : standardGrade.grade,
      gradePoint: isOngoing ? undefined : standardGrade.gradePoint,
    };

    if (isOngoing && c.type === 'theory') {
      baseCourse.attendance = { totalConducted: 24, attended: 22 };
      baseCourse.classTests = [
        { id: `ct1_${courseId}`, name: 'CT 1', obtainedMarks: 17.5, maxMarks: 20 },
        { id: `ct2_${courseId}`, name: 'CT 2', obtainedMarks: 18, maxMarks: 20 },
        { id: `ct3_${courseId}`, name: 'CT 3', obtainedMarks: 15, maxMarks: 20 },
      ];
    } else if (isOngoing && c.type === 'sessional') {
      baseCourse.projectedGradePoint = 4.0;
    }

    return baseCourse;
  });
}

/**
 * Generates the default routine metadata for an IPE semester
 */
export function getIpeRoutineForSemester(semesterId: string, section: string = 'Section A'): RoutineMetadata {
  const curr = IPE_CURRICULUM_DATA[semesterId] || IPE_CURRICULUM_DATA.L2T1;
  return {
    id: `routine_${semesterId}`,
    title: `Class Routine of IPE ${curr.shortLabel} ${section}`,
    subTitle: `${curr.label} | Department of Industrial & Production Engineering, BUET`,
    effectiveDate: 'Effective from: November 2026',
    slots: curr.routineSlots,
  };
}
