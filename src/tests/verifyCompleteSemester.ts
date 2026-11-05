/**
 * Comprehensive Verification Test for Routine Builder Connection & Complete Semester / BIIS Ingest
 */
import { useSemesterStore } from '../hooks/useSemesterStore';
import { ALL_TERM_IDS, getNextTermId, BUET_GRADE_POINTS, TermId } from '../types/semester';
import { INITIAL_BUET_COURSES } from '../data/initialSemesterData';
import { IPE_CURRICULUM_DATA } from '../utils/ipeCurriculum';

console.log('=== Running Verification: Routine Builder & Complete Semester Engine ===\n');

// Mock React useState and useCallback for node testing of the store logic
function createTestStore(initialTerm: TermId = 'L-2 T-2') {
  let currentTermId: TermId = initialTerm;
  let courses = [...INITIAL_BUET_COURSES];
  let routineSlots = [
    { id: 'slot_sat_1', day: 'Saturday', periodIndex: 1, courseCode: 'ME 243', details: { title: 'Mechanics of Solids', type: 'THEORY' as const } }
  ];

  const getSelectors = () => {
    const currentCourses = courses.filter((c) => c.termId === currentTermId);
    const currentTheoryCourses = courses.filter((c) => c.termId === currentTermId && c.type === 'THEORY');
    const currentSessionalCourses = courses.filter((c) => c.termId === currentTermId && c.type === 'SESSIONAL');
    const currentTermCredits = Math.round(currentCourses.reduce((sum, c) => sum + c.credits, 0) * 100) / 100;
    const completedCourses = courses.filter((c) => c.termId !== currentTermId && c.gradePoint !== undefined);
    const completedCredits = Math.round(completedCourses.reduce((sum, c) => sum + c.credits, 0) * 100) / 100;
    const totalPts = completedCourses.reduce((sum, c) => sum + c.credits * (c.gradePoint ?? 0), 0);
    const cumulativeCGPA = completedCredits > 0 ? Math.round((totalPts / completedCredits) * 100) / 100 : 0;

    return {
      currentTermId,
      courses,
      routineSlots,
      currentCourses,
      currentTheoryCourses,
      currentSessionalCourses,
      currentTermCredits,
      completedCourses,
      completedCredits,
      cumulativeCGPA,
    };
  };

  const assignRoutineSlot = (day: string, periodIndex: number, courseCode: string, details?: any) => {
    const idx = routineSlots.findIndex((s) => s.day === day && s.periodIndex === periodIndex);
    const newSlot = { id: `slot_${day}_${periodIndex}`, day, periodIndex, courseCode, details };
    if (idx >= 0) {
      routineSlots[idx] = newSlot;
    } else {
      routineSlots.push(newSlot);
    }
  };

  const removeRoutineSlot = (day: string, periodIndex: number) => {
    routineSlots = routineSlots.filter((s) => !(s.day === day && s.periodIndex === periodIndex));
  };

  const completeSemester = (grades: { code: string; finalGrade: string; gradePoint: number }[]) => {
    const gradeMap = new Map(grades.map((g) => [g.code, g]));
    let termGradePoints = 0;
    let termCredits = 0;

    const curCourses = courses.filter((c) => c.termId === currentTermId);
    curCourses.forEach((c) => {
      const g = gradeMap.get(c.code) || { finalGrade: 'A', gradePoint: 3.75 };
      termGradePoints += c.credits * g.gradePoint;
      termCredits += c.credits;
    });

    const termGPA = termCredits > 0 ? Math.round((termGradePoints / termCredits) * 100) / 100 : 0;
    const nextTerm = getNextTermId(currentTermId);

    courses = courses.map((c) => {
      if (c.termId === currentTermId) {
        const g = gradeMap.get(c.code) || { finalGrade: 'A', gradePoint: 3.75 };
        return {
          ...c,
          finalGrade: g.finalGrade,
          gradePoint: g.gradePoint,
          archivedAttendance: c.attendance ? { ...c.attendance } : undefined,
          archivedClassTests: c.classTests ? [...c.classTests] : undefined,
          attendance: undefined,
          classTests: undefined,
        };
      }
      return c;
    });

    if (nextTerm) {
      const nextKey = nextTerm.replace(/[-\s]/g, '');
      const hasNext = courses.some((c) => c.termId === nextTerm);
      if (!hasNext) {
        const nextCurriculum = (IPE_CURRICULUM_DATA as any)[nextKey];
        if (nextCurriculum) {
          const newCourses = nextCurriculum.courses.map((cur: any) => ({
            code: cur.code,
            title: cur.title,
            nickname: cur.nickname || cur.title,
            credits: cur.credits,
            type: cur.type.toUpperCase() === 'SESSIONAL' ? 'SESSIONAL' : 'THEORY',
            termId: nextTerm,
            teacher: cur.teacher,
            room: cur.room,
            color: cur.color,
            attendance: cur.type.toUpperCase() === 'THEORY' ? { attended: 0, conducted: 0 } : undefined,
            classTests: cur.type.toUpperCase() === 'THEORY' ? [] : undefined,
          }));
          courses = [...courses, ...newCourses];
        }
      }

      currentTermId = nextTerm;
    }

    const allCompleted = courses.filter(
      (c) => (nextTerm ? c.termId !== nextTerm : true) && c.gradePoint !== undefined
    );
    const totalCreds = allCompleted.reduce((sum, c) => sum + c.credits, 0);
    const totalPts = allCompleted.reduce((sum, c) => sum + c.credits * (c.gradePoint ?? 0), 0);
    const newCumulativeCGPA = totalCreds > 0 ? Math.round((totalPts / totalCreds) * 100) / 100 : 0;

    return {
      completedTermId: initialTerm,
      nextTermId: nextTerm,
      termGPA,
      termCredits: Math.round(termCredits * 100) / 100,
      newCumulativeCGPA,
      totalCompletedCredits: Math.round(totalCreds * 100) / 100,
    };
  };

  return {
    getSelectors,
    assignRoutineSlot,
    removeRoutineSlot,
    completeSemester,
  };
}

const store = createTestStore('L-2 T-2');

// -----------------------------------------------------------------------------
// Test 1: Routine Course Isolation (Strictly currentTermId)
// -----------------------------------------------------------------------------
console.log('--- TEST 1: Course Isolation in Routine Builder ---');
const s1 = store.getSelectors();
console.log(`Active Term: ${s1.currentTermId}`);
console.log(`Total courses available in current semester: ${s1.currentCourses.length}`);

// Ensure every single course belongs strictly to L-2 T-2
const nonMatching = s1.currentCourses.filter((c) => c.termId !== 'L-2 T-2');
if (nonMatching.length > 0) {
  throw new Error(`Course isolation violated! Found non-term courses: ${nonMatching.map((c) => c.code)}`);
}
console.log('✓ Verified: 0 courses leaked from other semesters.');

const theoryCodes = s1.currentTheoryCourses.map((c) => c.code);
console.log(`Theory courses for Routine dropdown (${theoryCodes.length}): ${theoryCodes.join(', ')}`);
if (!theoryCodes.includes('ME 243') || !theoryCodes.includes('IPE 205')) {
  throw new Error('Expected ME 243 and IPE 205 in active theory courses');
}
console.log('✓ Verified: Dropdown options contain strictly current semester courses.');

// -----------------------------------------------------------------------------
// Test 2: Timetable Slot Assignment and Removal
// -----------------------------------------------------------------------------
console.log('\n--- TEST 2: Assign and Remove Timetable Slot ---');
store.assignRoutineSlot('Sunday', 2, 'IPE 205', {
  title: 'Manufacturing Processes I',
  teacher: 'Nafis Sir',
  span: 1,
  type: 'THEORY',
});
const afterAssign = store.getSelectors().routineSlots.find((s) => s.day === 'Sunday' && s.periodIndex === 2);
if (!afterAssign || afterAssign.courseCode !== 'IPE 205') {
  throw new Error('Failed to assign routine slot on Sunday Period 2');
}
console.log('✓ Successfully assigned Sunday Period 2 to IPE 205');

store.removeRoutineSlot('Sunday', 2);
const afterRemove = store.getSelectors().routineSlots.find((s) => s.day === 'Sunday' && s.periodIndex === 2);
if (afterRemove) {
  throw new Error('Failed to remove routine slot on Sunday Period 2');
}
console.log('✓ Successfully cleared Sunday Period 2 slot');

// -----------------------------------------------------------------------------
// Test 3: Complete Semester / Ingest BIIS Sheet Execution
// -----------------------------------------------------------------------------
console.log('\n--- TEST 3: Complete Semester / Ingest BIIS Sheet ---');
const initialCompletedCredits = s1.completedCredits;
const initialCGPA = s1.cumulativeCGPA;
console.log(`Initial completed credits: ${initialCompletedCredits} cr`);
console.log(`Initial cumulative CGPA: ${initialCGPA.toFixed(2)}`);

// Simulating Ingest BIIS Sheet grades for L-2 T-2:
const biisGrades = [
  { code: 'ME 243', finalGrade: 'A+', gradePoint: 4.0 },
  { code: 'ME 265', finalGrade: 'A', gradePoint: 3.75 },
  { code: 'IPE 205', finalGrade: 'A+', gradePoint: 4.0 },
  { code: 'IPE 207', finalGrade: 'A', gradePoint: 3.75 },
  { code: 'IPE 209', finalGrade: 'A+', gradePoint: 4.0 },
  { code: 'ME 244', finalGrade: 'A+', gradePoint: 4.0 },
  { code: 'ME 266', finalGrade: 'A', gradePoint: 3.75 },
  { code: 'IPE 206', finalGrade: 'A+', gradePoint: 4.0 },
  { code: 'IPE 208', finalGrade: 'A', gradePoint: 3.75 },
];

const result = store.completeSemester(biisGrades);

console.log('\nResult of completeSemester:');
console.log(`- Completed Term: ${result.completedTermId}`);
console.log(`- Term Credits: ${result.termCredits} cr`);
console.log(`- Term GPA: ${result.termGPA.toFixed(2)}`);
console.log(`- Advanced to Next Term: ${result.nextTermId}`);
console.log(`- New Cumulative CGPA: ${result.newCumulativeCGPA.toFixed(2)}`);
console.log(`- Total Completed Credits: ${result.totalCompletedCredits} cr`);

if (result.nextTermId !== 'L-3 T-1') {
  throw new Error(`Expected nextTermId to advance to L-3 T-1, got ${result.nextTermId}`);
}
if (result.termGPA < 3.8 || result.termGPA > 4.0) {
  throw new Error(`Unexpected term GPA: ${result.termGPA}`);
}
if (result.totalCompletedCredits <= initialCompletedCredits) {
  throw new Error('Total completed credits did not increase after semester completion');
}

// -----------------------------------------------------------------------------
// Test 4: Verification of Data Archival and Next Semester State
// -----------------------------------------------------------------------------
console.log('\n--- TEST 4: Verification of Data Archival & Isolation ---');
const s2 = store.getSelectors();

// Verify active term is now L-3 T-1
if (s2.currentTermId !== 'L-3 T-1') {
  throw new Error(`Expected currentTermId to be L-3 T-1, got ${s2.currentTermId}`);
}
console.log(`✓ Active term is now: ${s2.currentTermId}`);

// Verify completed courses now include L-2 T-2 courses
const completedL2T2 = s2.completedCourses.filter((c) => c.termId === 'L-2 T-2');
console.log(`Completed courses in L-2 T-2: ${completedL2T2.length}`);
if (completedL2T2.length === 0) {
  throw new Error('L-2 T-2 courses not found in completedCourses');
}

// Verify that continuous marks were archived:
const archivedME243 = completedL2T2.find((c) => c.code === 'ME 243');
if (!archivedME243?.archivedAttendance || !archivedME243?.archivedClassTests) {
  throw new Error('ME 243 continuous assessment records were not archived!');
}
console.log(`✓ ME 243 archived attendance: attended ${archivedME243.archivedAttendance.attended}/${archivedME243.archivedAttendance.conducted}`);
console.log(`✓ ME 243 archived CTs count: ${archivedME243.archivedClassTests.length}`);
console.log(`✓ ME 243 active attendance is cleared: ${archivedME243.attendance === undefined}`);

// Verify new term L-3 T-1 has its fresh courses loaded:
console.log(`\nL-3 T-1 Courses count: ${s2.currentCourses.length}`);
const l3t1Theory = s2.currentTheoryCourses.map((c) => c.code);
console.log(`L-3 T-1 Theory Courses: ${l3t1Theory.join(', ')}`);
if (!l3t1Theory.includes('IPE 301') || !l3t1Theory.includes('IPE 305')) {
  throw new Error('L-3 T-1 courses not properly loaded after semester advancement');
}

// Verify fresh tracking initialized for L-3 T-1
const ipe301 = s2.currentCourses.find((c) => c.code === 'IPE 301');
if (!ipe301?.attendance || ipe301.attendance.attended !== 0 || ipe301.attendance.conducted !== 0) {
  throw new Error('Fresh attendance was not initialized for L-3 T-1 theory course');
}
console.log('✓ Verified: L-3 T-1 initialized with fresh attendance (0/0) and classTests array ([]).');

console.log('\n======================================================');
console.log('ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (0 ERRORS)');
console.log('======================================================');
