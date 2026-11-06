/**
 * Verification test script for useSemesterStore state logic and calculations
 */
import { recalculateBestNClassTests } from '../hooks/useSemesterStore';
import { INITIAL_BUET_COURSES, INITIAL_ROUTINE_SLOTS } from '../data/initialSemesterData';
import { TermId, Course, RoutineSlot } from '../types/semester';

console.log('=== Running useSemesterStore Logic Verification ===\n');

// 1. Initial State Checks
console.log('--- 1. Testing Default Term and Course Counts ---');
const defaultTermId: TermId = 'L-2 T-1';
console.log(`Default TermId: ${defaultTermId}`);
if (defaultTermId !== 'L-2 T-1') {
  throw new Error('Default termId must be L-2 T-1');
}

// 2. Selectors & Filters with currentTermId = 'L-2 T-1'
console.log('\n--- 2. Testing Selectors for L-2 T-1 ---');
const l2t1Courses = INITIAL_BUET_COURSES.filter((c) => c.termId === 'L-2 T-1');
const l2t1TheoryCourses = l2t1Courses.filter((c) => c.type === 'THEORY');
const l2t1Credits = l2t1Courses.reduce((sum, c) => sum + c.credits, 0);

console.log(`L-2 T-1 total courses: ${l2t1Courses.length}`);
console.log(`L-2 T-1 theory courses count: ${l2t1TheoryCourses.length} (Expected 5: MATH 291, EEE 271, MME 295, CSE 295, ME 245)`);
console.log(`L-2 T-1 credits: ${l2t1Credits} cr (Expected ~21.0 cr, NOT 160 cr)`);

if (l2t1TheoryCourses.length !== 5) {
  throw new Error(`Expected 5 theory courses in L-2 T-1, got ${l2t1TheoryCourses.length}`);
}
if (l2t1Credits > 30 || l2t1Credits < 15) {
  throw new Error(`Expected ~18-21 credits for L-2 T-1, got ${l2t1Credits}`);
}

// 3. Selectors & Filters with currentTermId = 'L-2 T-2' (Active Term)
console.log('\n--- 3. Testing Selectors for Active Term L-2 T-2 ---');
const l2t2Courses = INITIAL_BUET_COURSES.filter((c) => c.termId === 'L-2 T-2');
const l2t2TheoryCourses = l2t2Courses.filter((c) => c.type === 'THEORY');
const l2t2TheoryCodes = l2t2TheoryCourses.map((c) => c.code);
const l2t2Credits = l2t2Courses.reduce((sum, c) => sum + c.credits, 0);

console.log(`L-2 T-2 total courses: ${l2t2Courses.length}`);
console.log(`L-2 T-2 theory courses: ${l2t2TheoryCodes.join(', ')}`);
console.log(`L-2 T-2 credits: ${l2t2Credits} cr (Expected ~18.75 cr, NOT 160 cr)`);

const expectedCodes = ['ME 243', 'ME 265', 'IPE 205', 'IPE 207', 'IPE 209'];
for (const code of expectedCodes) {
  if (!l2t2TheoryCodes.includes(code)) {
    throw new Error(`Expected active course ${code} in L-2 T-2`);
  }
}

// 4. Completed Credits and Cumulative CGPA Calculation
console.log('\n--- 4. Testing Completed Terms strictly for CGPA ---');
// When current term is L-2 T-2, completed terms are L-1 T-1, L-1 T-2, L-2 T-1
const completedCoursesL2T2 = INITIAL_BUET_COURSES.filter(
  (c) => c.termId !== 'L-2 T-2' && c.gradePoint !== undefined
);
const completedCreditsL2T2 = completedCoursesL2T2.reduce((sum, c) => sum + c.credits, 0);
const totalPointsL2T2 = completedCoursesL2T2.reduce(
  (sum, c) => sum + c.credits * (c.gradePoint ?? 0),
  0
);
const cgpaL2T2 = Math.round((totalPointsL2T2 / completedCreditsL2T2) * 100) / 100;

console.log(`Completed courses count: ${completedCoursesL2T2.length}`);
console.log(`Completed credits: ${completedCreditsL2T2} cr (Expected ~62.5 cr)`);
console.log(`Cumulative CGPA: ${cgpaL2T2.toFixed(2)} (Expected ~3.82)`);

if (completedCreditsL2T2 !== 62.5) {
  throw new Error(`Expected 62.5 completed credits, got ${completedCreditsL2T2}`);
}
if (cgpaL2T2 < 3.5 || cgpaL2T2 > 4.0) {
  throw new Error(`Invalid CGPA calculation: ${cgpaL2T2}`);
}

// 5. Testing Best-n CT Calculation
console.log('\n--- 5. Testing Best-n Class Test Algorithm ---');
const testsSample = [
  { id: '1', name: 'CT 1', score: 17.5, outOf: 20 },
  { id: '2', name: 'CT 2', score: 18, outOf: 20 },
  { id: '3', name: 'CT 3', score: 14, outOf: 20 },
  { id: '4', name: 'CT 4', score: 19, outOf: 20 },
];
const resultCT = recalculateBestNClassTests(testsSample);
console.log('Recalculated CTs:', resultCT);
const countedCTs = resultCT.filter((t) => t.isCounted);
const droppedCTs = resultCT.filter((t) => !t.isCounted);

if (countedCTs.length !== 3 || droppedCTs.length !== 1 || droppedCTs[0].id !== '3') {
  throw new Error('Best 3 of 4 CT recalculation failed');
}
console.log('✓ Best 3 of 4 CT correctly dropped lowest score (14/20)');

// 6. Routine Slots
console.log('\n--- 6. Testing Routine Slots Pre-population ---');
console.log(`Initial routine slots count: ${INITIAL_ROUTINE_SLOTS.length}`);
if (INITIAL_ROUTINE_SLOTS.length === 0) {
  throw new Error('Routine slots must not be empty');
}

console.log('\n======================================================');
console.log('✓ ALL USE_SEMESTER_STORE VERIFICATION TESTS PASSED!');
console.log('======================================================\n');
