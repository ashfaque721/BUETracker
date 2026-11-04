import type { CourseType } from '../types';

export interface BuetCatalogCourse {
  code: string;
  dept: string;
  courseNo: number;
  title: string;
  credits: number;
  type: CourseType;
  keywords: string[];
}

export const BUET_COURSE_CATALOG: BuetCatalogCourse[] = [
  // Chemistry
  {
    code: 'CHEM 114',
    dept: 'CHEM',
    courseNo: 114,
    title: 'Inorganic Quantitative Analysis Sessional',
    credits: 1.5,
    type: 'sessional',
    keywords: ['inorganic', 'quantitative', 'analysis', 'sessional', 'chem 114'],
  },
  {
    code: 'CHEM 119',
    dept: 'CHEM',
    courseNo: 119,
    title: 'Chemistry - I',
    credits: 3.0,
    type: 'theory',
    keywords: ['chemistry - i', 'chemistry 1', 'chem 119', 'physical and inorganic'],
  },
  {
    code: 'CHEM 109',
    dept: 'CHEM',
    courseNo: 109,
    title: 'Chemistry - I',
    credits: 3.0,
    type: 'theory',
    keywords: ['chemistry - i', 'chem 109'],
  },
  {
    code: 'CHEM 111',
    dept: 'CHEM',
    courseNo: 111,
    title: 'Inorganic Chemistry',
    credits: 3.0,
    type: 'theory',
    keywords: ['inorganic chemistry', 'chem 111'],
  },
  {
    code: 'CHEM 141',
    dept: 'CHEM',
    courseNo: 141,
    title: 'Chemistry of Engineering Materials',
    credits: 3.0,
    type: 'theory',
    keywords: ['materials', 'chem 141'],
  },

  // Humanities
  {
    code: 'HUM 102',
    dept: 'HUM',
    courseNo: 102,
    title: 'English Language Practice',
    credits: 1.5,
    type: 'sessional',
    keywords: ['english language practice', 'english practice', 'hum 102', 'language practice'],
  },
  {
    code: 'HUM 211',
    dept: 'HUM',
    courseNo: 211,
    title: 'Sociology',
    credits: 2.0,
    type: 'theory',
    keywords: ['sociology', 'hum 211'],
  },
  {
    code: 'HUM 111',
    dept: 'HUM',
    courseNo: 111,
    title: 'English',
    credits: 3.0,
    type: 'theory',
    keywords: ['english', 'hum 111'],
  },
  {
    code: 'HUM 113',
    dept: 'HUM',
    courseNo: 113,
    title: 'Economics',
    credits: 2.0,
    type: 'theory',
    keywords: ['economics', 'hum 113'],
  },
  {
    code: 'HUM 203',
    dept: 'HUM',
    courseNo: 203,
    title: 'Government and Politics',
    credits: 2.0,
    type: 'theory',
    keywords: ['government', 'politics', 'hum 203'],
  },
  {
    code: 'HUM 277',
    dept: 'HUM',
    courseNo: 277,
    title: 'Fundamentals of Economics',
    credits: 2.0,
    type: 'theory',
    keywords: ['fundamentals of economics', 'hum 277'],
  },

  // Industrial & Production Engineering
  {
    code: 'IPE 105',
    dept: 'IPE',
    courseNo: 105,
    title: 'Principles of Cost and Management Accounting',
    credits: 3.0,
    type: 'theory',
    keywords: ['principles of cost and management accounting', 'cost and management', 'accounting', 'ipe 105'],
  },
  {
    code: 'IPE 101',
    dept: 'IPE',
    courseNo: 101,
    title: 'Introduction to Industrial & Production Engineering',
    credits: 3.0,
    type: 'theory',
    keywords: ['introduction to industrial', 'production engineering', 'ipe 101'],
  },
  {
    code: 'IPE 201',
    dept: 'IPE',
    courseNo: 201,
    title: 'Manufacturing Processes I',
    credits: 3.0,
    type: 'theory',
    keywords: ['manufacturing processes i', 'manufacturing processes 1', 'ipe 201'],
  },
  {
    code: 'IPE 205',
    dept: 'IPE',
    courseNo: 205,
    title: 'Manufacturing Processes I',
    credits: 3.0,
    type: 'theory',
    keywords: ['manufacturing processes i', 'ipe 205'],
  },
  {
    code: 'IPE 206',
    dept: 'IPE',
    courseNo: 206,
    title: 'Manufacturing Processes I Sessional',
    credits: 0.75,
    type: 'sessional',
    keywords: ['manufacturing processes i sessional', 'ipe 206'],
  },
  {
    code: 'IPE 207',
    dept: 'IPE',
    courseNo: 207,
    title: 'Operations Management',
    credits: 3.0,
    type: 'theory',
    keywords: ['operations management', 'metallurgy', 'ipe 207'],
  },
  {
    code: 'IPE 208',
    dept: 'IPE',
    courseNo: 208,
    title: 'Engineering Metallurgy Sessional',
    credits: 0.75,
    type: 'sessional',
    keywords: ['metallurgy sessional', 'ipe 208'],
  },
  {
    code: 'IPE 209',
    dept: 'IPE',
    courseNo: 209,
    title: 'Engineering Economy',
    credits: 2.0,
    type: 'theory',
    keywords: ['engineering economy', 'economy', 'ipe 209'],
  },

  // Mathematics
  {
    code: 'MATH 191',
    dept: 'MATH',
    courseNo: 191,
    title: 'Differential and Integral Calculus',
    credits: 4.0,
    type: 'theory',
    keywords: ['differential and integral calculus', 'calculus', 'differential', 'integral', 'math 191'],
  },
  {
    code: 'MATH 193',
    dept: 'MATH',
    courseNo: 193,
    title: 'Differential Equations and Statistics',
    credits: 4.0,
    type: 'theory',
    keywords: ['differential equations', 'statistics', 'math 193', 'vectors'],
  },
  {
    code: 'MATH 141',
    dept: 'MATH',
    courseNo: 141,
    title: 'Differential Calculus and Solid Geometry',
    credits: 3.0,
    type: 'theory',
    keywords: ['solid geometry', 'differential calculus', 'math 141'],
  },
  {
    code: 'MATH 143',
    dept: 'MATH',
    courseNo: 143,
    title: 'Integral Calculus and Ordinary Differential Equations',
    credits: 3.0,
    type: 'theory',
    keywords: ['ordinary differential equations', 'integral calculus', 'math 143'],
  },
  {
    code: 'MATH 161',
    dept: 'MATH',
    courseNo: 161,
    title: 'Differential and Integral Calculus',
    credits: 3.0,
    type: 'theory',
    keywords: ['differential and integral calculus', 'math 161'],
  },

  // Mechanical Engineering
  {
    code: 'ME 160',
    dept: 'ME',
    courseNo: 160,
    title: 'Mechanical Engineering Drawing - I',
    credits: 1.5,
    type: 'sessional',
    keywords: ['mechanical engineering drawing', 'drawing - i', 'drawing 1', 'me 160'],
  },
  {
    code: 'ME 165',
    dept: 'ME',
    courseNo: 165,
    title: 'Basic Mechanical Engineering',
    credits: 3.0,
    type: 'theory',
    keywords: ['basic mechanical engineering', 'me 165'],
  },
  {
    code: 'ME 171',
    dept: 'ME',
    courseNo: 171,
    title: 'Computer Programming Language',
    credits: 3.0,
    type: 'theory',
    keywords: ['computer programming language', 'me 171'],
  },
  {
    code: 'ME 243',
    dept: 'ME',
    courseNo: 243,
    title: 'Mechanics of Solids',
    credits: 3.0,
    type: 'theory',
    keywords: ['mechanics of solids', 'me 243'],
  },
  {
    code: 'ME 244',
    dept: 'ME',
    courseNo: 244,
    title: 'Mechanics of Solids Sessional',
    credits: 0.75,
    type: 'sessional',
    keywords: ['mechanics of solids sessional', 'me 244'],
  },
  {
    code: 'ME 265',
    dept: 'ME',
    courseNo: 265,
    title: 'Thermal Engineering and Heat Transfer',
    credits: 3.0,
    type: 'theory',
    keywords: ['thermal engineering and heat transfer', 'me 265', 'heat transfer'],
  },
  {
    code: 'ME 266',
    dept: 'ME',
    courseNo: 266,
    title: 'Thermal Engineering Sessional',
    credits: 0.75,
    type: 'sessional',
    keywords: ['thermal engineering sessional', 'me 266'],
  },

  // Physics
  {
    code: 'PHY 117',
    dept: 'PHY',
    courseNo: 117,
    title: 'Structure of Matter, Electricity, Magnetism and Modern Physics',
    credits: 3.0,
    type: 'theory',
    keywords: ['structure of matter', 'electricity', 'magnetism', 'modern physics', 'phy 117'],
  },
  {
    code: 'PHY 114',
    dept: 'PHY',
    courseNo: 114,
    title: 'Physics Sessional',
    credits: 1.5,
    type: 'sessional',
    keywords: ['physics sessional', 'phy 114'],
  },
  {
    code: 'PHY 102',
    dept: 'PHY',
    courseNo: 102,
    title: 'Physics Sessional',
    credits: 1.5,
    type: 'sessional',
    keywords: ['physics sessional', 'phy 102'],
  },
  {
    code: 'PHY 121',
    dept: 'PHY',
    courseNo: 121,
    title: 'Waves and Oscillations, Optics and Thermal Physics',
    credits: 3.0,
    type: 'theory',
    keywords: ['waves and oscillations', 'optics', 'thermal physics', 'phy 121'],
  },

  // Workshops
  {
    code: 'SHOP 170',
    dept: 'SHOP',
    courseNo: 170,
    title: 'Machine Shop',
    credits: 0.75,
    type: 'sessional',
    keywords: ['machine shop', 'shop 170', 'lathe', 'milling'],
  },
  {
    code: 'SHOP 160',
    dept: 'SHOP',
    courseNo: 160,
    title: 'Foundry and Welding Shop',
    credits: 0.75,
    type: 'sessional',
    keywords: ['foundry', 'welding', 'shop 160'],
  },
  {
    code: 'SHOP 180',
    dept: 'SHOP',
    courseNo: 180,
    title: 'Sheet Metal and Carpentry Shop',
    credits: 0.75,
    type: 'sessional',
    keywords: ['sheet metal', 'carpentry', 'shop 180'],
  },

  // Electrical & Electronic Engineering
  {
    code: 'EEE 163',
    dept: 'EEE',
    courseNo: 163,
    title: 'Introduction to Electrical Engineering',
    credits: 3.0,
    type: 'theory',
    keywords: ['introduction to electrical', 'eee 163', 'circuits'],
  },
  {
    code: 'EEE 164',
    dept: 'EEE',
    courseNo: 164,
    title: 'Electrical Engineering Sessional',
    credits: 1.5,
    type: 'sessional',
    keywords: ['electrical engineering sessional', 'eee 164'],
  },
  {
    code: 'EEE 201',
    dept: 'EEE',
    courseNo: 201,
    title: 'Electronic Circuits I',
    credits: 3.0,
    type: 'theory',
    keywords: ['electronic circuits', 'eee 201'],
  },

  // Computer Science & Engineering
  {
    code: 'CSE 100',
    dept: 'CSE',
    courseNo: 100,
    title: 'Introduction to Computer Systems',
    credits: 1.5,
    type: 'sessional',
    keywords: ['introduction to computer systems', 'cse 100'],
  },
  {
    code: 'CSE 101',
    dept: 'CSE',
    courseNo: 101,
    title: 'Structured Programming Language',
    credits: 3.0,
    type: 'theory',
    keywords: ['structured programming language', 'cse 101', 'c programming'],
  },
  {
    code: 'CSE 102',
    dept: 'CSE',
    courseNo: 102,
    title: 'Structured Programming Language Sessional',
    credits: 1.5,
    type: 'sessional',
    keywords: ['structured programming language sessional', 'cse 102'],
  },
  {
    code: 'CSE 207',
    dept: 'CSE',
    courseNo: 207,
    title: 'Data Structures and Algorithms I',
    credits: 3.0,
    type: 'theory',
    keywords: ['data structures', 'algorithms', 'cse 207'],
  },

  // Civil Engineering
  {
    code: 'CE 100',
    dept: 'CE',
    courseNo: 100,
    title: 'Civil Engineering Drawing',
    credits: 1.5,
    type: 'sessional',
    keywords: ['civil engineering drawing', 'ce 100'],
  },
  {
    code: 'CE 101',
    dept: 'CE',
    courseNo: 101,
    title: 'Analytic Mechanics',
    credits: 3.0,
    type: 'theory',
    keywords: ['analytic mechanics', 'ce 101'],
  },
  {
    code: 'CE 102',
    dept: 'CE',
    courseNo: 102,
    title: 'Computer Aided Drafting',
    credits: 1.5,
    type: 'sessional',
    keywords: ['computer aided drafting', 'cad', 'ce 102'],
  },
];

export interface SemesterPreset {
  id: string;
  name: string;
  department: string;
  levelTerm: string;
  courses: {
    code: string;
    title: string;
    credits: number;
    type: CourseType;
  }[];
}

export const SEMESTER_PRESETS: SemesterPreset[] = [
  {
    id: 'ipe_1_1',
    name: 'IPE Level-1 Term-1 (Standard Curriculum)',
    department: 'IPE',
    levelTerm: '1-1',
    courses: [
      { code: 'CHEM 114', title: 'Inorganic Quantitative Analysis Sessional', credits: 1.5, type: 'sessional' },
      { code: 'CHEM 119', title: 'Chemistry - I', credits: 3.0, type: 'theory' },
      { code: 'HUM 102', title: 'English Language Practice', credits: 1.5, type: 'sessional' },
      { code: 'HUM 211', title: 'Sociology', credits: 2.0, type: 'theory' },
      { code: 'IPE 105', title: 'Principles of Cost and Management Accounting', credits: 3.0, type: 'theory' },
      { code: 'MATH 191', title: 'Differential and Integral Calculus', credits: 4.0, type: 'theory' },
      { code: 'ME 160', title: 'Mechanical Engineering Drawing - I', credits: 1.5, type: 'sessional' },
      { code: 'PHY 117', title: 'Structure of Matter, Electricity, Magnetism and Modern Physics', credits: 3.0, type: 'theory' },
      { code: 'SHOP 170', title: 'Machine Shop', credits: 0.75, type: 'sessional' },
    ],
  },
  {
    id: 'me_1_1',
    name: 'ME Level-1 Term-1 (Standard Curriculum)',
    department: 'ME',
    levelTerm: '1-1',
    courses: [
      { code: 'CHEM 109', title: 'Chemistry - I', credits: 3.0, type: 'theory' },
      { code: 'CHEM 114', title: 'Inorganic Quantitative Analysis Sessional', credits: 1.5, type: 'sessional' },
      { code: 'MATH 141', title: 'Differential Calculus and Solid Geometry', credits: 3.0, type: 'theory' },
      { code: 'ME 160', title: 'Mechanical Engineering Drawing - I', credits: 1.5, type: 'sessional' },
      { code: 'ME 165', title: 'Basic Mechanical Engineering', credits: 3.0, type: 'theory' },
      { code: 'PHY 102', title: 'Physics Sessional', credits: 1.5, type: 'sessional' },
      { code: 'PHY 121', title: 'Waves and Oscillations, Optics and Thermal Physics', credits: 3.0, type: 'theory' },
      { code: 'SHOP 160', title: 'Foundry and Welding Shop', credits: 0.75, type: 'sessional' },
    ],
  },
  {
    id: 'cse_1_1',
    name: 'CSE Level-1 Term-1 (Standard Curriculum)',
    department: 'CSE',
    levelTerm: '1-1',
    courses: [
      { code: 'CSE 100', title: 'Introduction to Computer Systems', credits: 1.5, type: 'sessional' },
      { code: 'CSE 101', title: 'Structured Programming Language', credits: 3.0, type: 'theory' },
      { code: 'CSE 102', title: 'Structured Programming Language Sessional', credits: 1.5, type: 'sessional' },
      { code: 'EEE 163', title: 'Introduction to Electrical Engineering', credits: 3.0, type: 'theory' },
      { code: 'EEE 164', title: 'Electrical Engineering Sessional', credits: 1.5, type: 'sessional' },
      { code: 'MATH 141', title: 'Differential Calculus and Solid Geometry', credits: 3.0, type: 'theory' },
      { code: 'PHY 102', title: 'Physics Sessional', credits: 1.5, type: 'sessional' },
      { code: 'PHY 121', title: 'Waves and Oscillations, Optics and Thermal Physics', credits: 3.0, type: 'theory' },
    ],
  },
  {
    id: 'eee_1_1',
    name: 'EEE Level-1 Term-1 (Standard Curriculum)',
    department: 'EEE',
    levelTerm: '1-1',
    courses: [
      { code: 'CHEM 109', title: 'Chemistry - I', credits: 3.0, type: 'theory' },
      { code: 'CHEM 114', title: 'Inorganic Quantitative Analysis Sessional', credits: 1.5, type: 'sessional' },
      { code: 'EEE 163', title: 'Introduction to Electrical Engineering', credits: 3.0, type: 'theory' },
      { code: 'EEE 164', title: 'Electrical Engineering Sessional', credits: 1.5, type: 'sessional' },
      { code: 'HUM 111', title: 'English', credits: 3.0, type: 'theory' },
      { code: 'MATH 141', title: 'Differential Calculus and Solid Geometry', credits: 3.0, type: 'theory' },
      { code: 'PHY 102', title: 'Physics Sessional', credits: 1.5, type: 'sessional' },
      { code: 'PHY 121', title: 'Waves and Oscillations, Optics and Thermal Physics', credits: 3.0, type: 'theory' },
    ],
  },
  {
    id: 'ce_1_1',
    name: 'CE Level-1 Term-1 (Standard Curriculum)',
    department: 'CE',
    levelTerm: '1-1',
    courses: [
      { code: 'CE 100', title: 'Civil Engineering Drawing', credits: 1.5, type: 'sessional' },
      { code: 'CE 101', title: 'Analytic Mechanics', credits: 3.0, type: 'theory' },
      { code: 'CHEM 109', title: 'Chemistry - I', credits: 3.0, type: 'theory' },
      { code: 'CHEM 114', title: 'Inorganic Quantitative Analysis Sessional', credits: 1.5, type: 'sessional' },
      { code: 'HUM 111', title: 'English', credits: 3.0, type: 'theory' },
      { code: 'MATH 141', title: 'Differential Calculus and Solid Geometry', credits: 3.0, type: 'theory' },
      { code: 'PHY 102', title: 'Physics Sessional', credits: 1.5, type: 'sessional' },
      { code: 'PHY 121', title: 'Waves and Oscillations, Optics and Thermal Physics', credits: 3.0, type: 'theory' },
      { code: 'SHOP 160', title: 'Foundry and Welding Shop', credits: 0.75, type: 'sessional' },
    ],
  },
];

/**
 * Fuzzy matches noisy OCR text against the known BUET catalog
 */
export function matchBuetCourse(rawCode: string, rawTitle: string): BuetCatalogCourse | null {
  const normCode = rawCode
    .replace(/[OCoc]/g, (match, offset) => (offset > 2 ? '0' : match))
    .replace(/\s+/g, ' ')
    .trim()
    .toUpperCase();

  const codeNumberMatch = normCode.match(/\b([1-4]\d{2,3})\b/) || rawTitle.match(/\b([1-4]\d{2,3})\b/);
  const detectedNum = codeNumberMatch ? parseInt(codeNumberMatch[1], 10) : 0;

  const normTitle = rawTitle.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');

  let bestMatch: BuetCatalogCourse | null = null;
  let bestScore = 0;

  for (const course of BUET_COURSE_CATALOG) {
    // BUET Ordinance Rule: Odd course numbers are Theory, Even course numbers are Sessional!
    // Disallow matching a theory course when detected is sessional (or vice versa), unless detectedNum is 0.
    if (detectedNum > 0) {
      const detectedIsEven = detectedNum % 2 === 0;
      const courseIsEven = course.courseNo % 2 === 0;
      if (detectedIsEven !== courseIsEven) {
        continue;
      }
    }

    let score = 0;

    // Exact course number match
    if (detectedNum > 0 && course.courseNo === detectedNum) {
      score += 50;
    }

    // Course department code match
    if (normCode.includes(course.dept)) {
      score += 30;
    }

    // Title keyword matching
    for (const kw of course.keywords) {
      if (normTitle.includes(kw)) {
        score += 25;
      }
    }

    // Direct department prefix resolution
    if (course.dept === 'CHEM' && /chem|inorganic|quantitative|chemistry/i.test(rawTitle)) score += 15;
    if (course.dept === 'HUM' && /english|sociology|economics|society|language/i.test(rawTitle)) score += 15;
    if (course.dept === 'MATH' && /calculus|differential|integral|algebra/i.test(rawTitle)) score += 15;
    if (course.dept === 'IPE' && /cost|management|accounting|production|metallurgy|manufacturing/i.test(rawTitle)) score += 15;
    if (course.dept === 'ME' && /drawing|machine|mechanical|solids|thermal/i.test(rawTitle)) score += 15;
    if (course.dept === 'PHY' && /physics|matter|electricity|magnetism/i.test(rawTitle)) score += 15;
    if (course.dept === 'SHOP' && /shop|foundry|welding|machine shop/i.test(rawTitle)) score += 15;

    if (score > bestScore && score >= 35) {
      bestScore = score;
      bestMatch = course;
    }
  }

  return bestMatch;
}
