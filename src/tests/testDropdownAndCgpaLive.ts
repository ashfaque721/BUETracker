import { calculateGPA } from '../utils/buetOrdinance';
import {
  appCourseToStoreCourse,
  storeCourseToAppCourse,
  normalizeCourseCode,
  semIdToTermId,
  termIdToSemId,
} from '../utils/courseBridge';
import { BUET_GRADE_SCALE, Course } from '../types';
import { INITIAL_BUET_COURSES } from '../data/initialSemesterData';
import { TermId } from '../types/semester';

console.log('=== TEST: Comprehensive Dropdown Grade & CGPA Recalculation ===\n');

// 1. Initial State Setup
let storeCourses = [...INITIAL_BUET_COURSES];
let currentTermId: TermId = 'L-2 T-2';

const getAppCourses = () =>
  storeCourses.map((c) => storeCourseToAppCourse(c, currentTermId));

// Helper mimicking App.tsx handleUpdateCourse
const handleUpdateCourse = (course: Course) => {
  const normCode = normalizeCourseCode(course.code);
  const semId = termIdToSemId(course.semesterId);
  const termId = semIdToTermId(course.semesterId);

  const sc = appCourseToStoreCourse(course);
  const exists = storeCourses.some(
    (c) => normalizeCourseCode(c.code) === normCode && semIdToTermId(c.termId) === termId
  );

  if (exists) {
    storeCourses = storeCourses.map((c) => {
      if (normalizeCourseCode(c.code) === normCode && semIdToTermId(c.termId) === termId) {
        return {
          ...c,
          ...sc,
          finalGrade: sc.finalGrade,
          gradePoint: sc.gradePoint,
        };
      }
      return c;
    });
  } else {
    storeCourses = [...storeCourses, sc];
  }
};

// Helper mimicking App.tsx handleBulkUpdateCourses
const handleBulkUpdateCourses = (updatedList: Course[]) => {
  const newStoreList = updatedList.map(appCourseToStoreCourse);
  const storeMap = new Map(
    newStoreList.map((sc) => [`${semIdToTermId(sc.termId)}_${normalizeCourseCode(sc.code)}`, sc])
  );

  storeCourses = storeCourses.map((c) => {
    const key = `${semIdToTermId(c.termId)}_${normalizeCourseCode(c.code)}`;
    const match = storeMap.get(key);
    if (match) {
      storeMap.delete(key);
      return {
        ...c,
        ...match,
        finalGrade: match.finalGrade,
        gradePoint: match.gradePoint,
      };
    }
    return c;
  });

  storeCourses = [...storeCourses, ...Array.from(storeMap.values())];
};

// Helper mimicking overall CGPA calculation
const getOverallCGPA = () => {
  const graded = storeCourses.filter((c) => typeof c.gradePoint === 'number' && !isNaN(c.gradePoint));
  return calculateGPA(graded.map((c) => ({ credits: c.credits, gradePoint: c.gradePoint })));
};

// Helper mimicking CourseManager semester GPA
const getSemesterGPA = (semId: string) => {
  const semTerm = semIdToTermId(semId);
  const semCourses = storeCourses.filter((c) => semIdToTermId(c.termId) === semTerm);
  const graded = semCourses.filter((c) => typeof c.gradePoint === 'number' && !isNaN(c.gradePoint));
  return calculateGPA(graded.map((c) => ({ credits: c.credits, gradePoint: c.gradePoint })));
};

// --- TEST 1: Initial CGPA ---
const initialCGPA = getOverallCGPA();
console.log('1. Initial Cumulative CGPA:', initialCGPA.gpa, 'Total Graded Credits:', initialCGPA.totalCredits);
if (initialCGPA.gpa !== 3.82) throw new Error(`Expected initial CGPA 3.82, got ${initialCGPA.gpa}`);
if (initialCGPA.totalCredits !== 62.5) throw new Error(`Expected initial credits 62.5, got ${initialCGPA.totalCredits}`);
console.log('   ✅ Initial CGPA check passed.');

// --- TEST 2: Single Course Dropdown Edit in Completed Semester ---
console.log('\n2. Testing Single Course Dropdown Edit (MATH 191 in L-1 T-1: A+ (4.0) -> B (3.0))...');
const appCoursesL1T1 = getAppCourses().filter((c) => c.semesterId === 'L1T1');
const mathCourse = appCoursesL1T1.find((c) => c.code === 'MATH 191')!;
const initialL1T1Gpa = getSemesterGPA('L1T1');

// User changes grade to 'B' (3.00)
handleUpdateCourse({
  ...mathCourse,
  grade: 'B',
  gradePoint: 3.0,
  projectedGradePoint: 3.0,
});

const postEditL1T1Gpa = getSemesterGPA('L1T1');
const postEditCGPA = getOverallCGPA();
console.log('   L-1 T-1 GPA: before =', initialL1T1Gpa.gpa, 'after =', postEditL1T1Gpa.gpa);
console.log('   Cumulative CGPA: before =', initialCGPA.gpa, 'after =', postEditCGPA.gpa);

// Math 191 is 4.0 credits. Dropping from 4.0 to 3.0 drops 4.0 total grade points.
// New CGPA: (238.7675 - 4.0) / 62.5 = 234.7675 / 62.5 = 3.75628 -> 3.76
if (postEditCGPA.gpa !== 3.75) throw new Error(`Expected CGPA 3.75 after edit, got ${postEditCGPA.gpa}`);
if (postEditL1T1Gpa.gpa >= initialL1T1Gpa.gpa) throw new Error('Expected L-1 T-1 GPA to decrease');
console.log('   ✅ Single course dropdown edit accurately updated Term GPA and Cumulative CGPA.');

// --- TEST 3: Assigning Grade to Active Term Course ---
console.log('\n3. Testing Dropdown Edit on Active Course (ME 243 in L-2 T-2: unassigned -> A+ (4.0))...');
const activeCourse = getAppCourses().find((c) => c.code === 'ME 243' && c.semesterId === 'L2T2')!;
handleUpdateCourse({
  ...activeCourse,
  grade: 'A+',
  gradePoint: 4.0,
  projectedGradePoint: 4.0,
});

const postActiveCGPA = getOverallCGPA();
console.log('   Cumulative CGPA after active grade assigned:', postActiveCGPA.gpa, 'Total Graded Credits:', postActiveCGPA.totalCredits);
if (postActiveCGPA.totalCredits !== 65.5) throw new Error(`Expected 65.5 graded credits (62.5 + 3.0), got ${postActiveCGPA.totalCredits}`);
console.log('   ✅ Active course grade immediately included in live Cumulative CGPA.');

// --- TEST 4: F Grade Handling (Ordinance Verification) ---
console.log('\n4. Testing F Grade (0.00 Grade Point) Handling...');
const courseForF = getAppCourses().find((c) => c.code === 'PHY 117' && c.semesterId === 'L1T1')!;
handleUpdateCourse({
  ...courseForF,
  grade: 'F',
  gradePoint: 0.0,
  projectedGradePoint: 0.0,
});

const postFCGPA = getOverallCGPA();
console.log('   Cumulative CGPA after F grade:', postFCGPA.gpa, 'Credits counted in calculation:', postFCGPA.totalCredits);
if (postFCGPA.totalCredits !== 65.5) throw new Error(`F grade credits must remain in totalCredits for CGPA calculation, got ${postFCGPA.totalCredits}`);
if (postFCGPA.gpa >= postActiveCGPA.gpa) throw new Error('F grade must lower the CGPA');
console.log('   ✅ F grade properly counted with 0.00 grade point and full credits in denominator.');

// --- TEST 5: Batch Set All Dropdown ---
console.log('\n5. Testing "Set All: All A+" Batch Setter on L-2 T-1...');
const l2t1Courses = getAppCourses().filter((c) => c.semesterId === 'L2T1');
const allAplus = l2t1Courses.map((c) => ({
  ...c,
  grade: 'A+',
  gradePoint: 4.0,
  projectedGradePoint: 4.0,
}));
handleBulkUpdateCourses(allAplus);

const postBatchL2T1Gpa = getSemesterGPA('L2T1');
console.log('   L-2 T-1 GPA after Set All A+:', postBatchL2T1Gpa.gpa);
if (postBatchL2T1Gpa.gpa !== 4.0) throw new Error(`Expected 4.00 for All A+, got ${postBatchL2T1Gpa.gpa}`);
console.log('   ✅ Batch "Set All" dropdown successfully updated all courses in semester.');

// --- TEST 6: CourseManager Pill CGPA Verification ---
console.log('\n6. Testing CourseManager Pill CGPA for L-2 T-1...');
const freshStoreCourses = [...INITIAL_BUET_COURSES];
const l2t1FreshCourses = freshStoreCourses.filter((c) => c.termId === 'L-2 T-1');
const l2t1Gpa = calculateGPA(l2t1FreshCourses.map((c) => ({ credits: c.credits, gradePoint: c.gradePoint })));

const semIndex = 2; // L2T1
const semIdsUpToL2T1 = new Set(['L-1 T-1', 'L-1 T-2', 'L-2 T-1']);
const coursesUpToL2T1 = freshStoreCourses.filter(
  (c) => semIdsUpToL2T1.has(c.termId) && typeof c.gradePoint === 'number'
);
const l2t1PillCgpa = calculateGPA(coursesUpToL2T1.map((c) => ({ credits: c.credits, gradePoint: c.gradePoint })));

console.log('   L-2 T-1 Term GPA:', l2t1Gpa.gpa, '(21 Cr)');
console.log('   L-2 T-1 Cumulative CGPA in Pill:', l2t1PillCgpa.gpa, `(${l2t1PillCgpa.totalCredits} Cr)`);

if (l2t1Gpa.gpa !== 3.83) throw new Error(`Expected L-2 T-1 Term GPA 3.83, got ${l2t1Gpa.gpa}`);
if (l2t1PillCgpa.gpa !== 3.82) throw new Error(`Expected L-2 T-1 Cumulative CGPA 3.82, got ${l2t1PillCgpa.gpa}`);
if (l2t1PillCgpa.totalCredits !== 62.5) throw new Error(`Expected 62.5 credits, got ${l2t1PillCgpa.totalCredits}`);
console.log('   ✅ Pill correctly shows 3.83 GPA and 3.82 CGPA (NOT 3.83 CGPA)!');

console.log('\n🎉 ALL DROPDOWN AND CGPA ACCURACY TESTS PASSED!');
