import { getIpeCoursesForSemester, getIpeRoutineForSemester, IPE_CURRICULUM_DATA } from '../utils/ipeCurriculum';
import { storeCourseToAppCourse, appCourseToStoreCourse, termIdToSemId, semIdToTermId } from '../utils/courseBridge';
import { BUET_SEMESTERS } from '../types';
import { TermId } from '../types/semester';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

console.log('=== TEST SUITE: BUETracker Semester Switching & Past Courses Verification ===\n');

// 1. Test Setup Wizard Multi-Semester Ingestion for L-2 T-2
console.log('Test 1: Multi-semester generation for L-2 T-2 student');
const selectedSemesterId = 'L2T2';
const selectedIndex = BUET_SEMESTERS.findIndex((s) => s.id === selectedSemesterId);
assert(selectedIndex === 3, 'L2T2 is the 4th semester (index 3)');

const previousSemesters = BUET_SEMESTERS.slice(0, selectedIndex);
assert(previousSemesters.length === 3, '3 previous completed semesters (L1T1, L1T2, L2T1)');

const allPrevCourses: any[] = [];
for (const pSem of previousSemesters) {
  const courses = getIpeCoursesForSemester(pSem.id, false);
  assert(courses.length > 0, `${pSem.shortLabel} has ${courses.length} courses`);
  courses.forEach((c) => {
    assert(!c.isOngoing, `${c.code} is marked completed (!isOngoing)`);
    assert(c.grade !== undefined && c.grade.length > 0, `${c.code} has letter grade ${c.grade}`);
    assert(c.gradePoint !== undefined && c.gradePoint > 0, `${c.code} has gradePoint ${c.gradePoint}`);
  });
  allPrevCourses.push(...courses);
}

const totalPrevCredits = allPrevCourses.reduce((sum, c) => sum + c.credits, 0);
const totalPrevPts = allPrevCourses.reduce((sum, c) => sum + c.credits * c.gradePoint, 0);
const prevCgpa = totalPrevPts / totalPrevCredits;
console.log(`Generated ${allPrevCourses.length} prior completed courses across 3 semesters: ${totalPrevCredits.toFixed(1)} cr, ${prevCgpa.toFixed(2)} CGPA`);
assert(totalPrevCredits > 60, 'Total completed credits > 60 cr (~61.5 cr)');
assert(prevCgpa >= 3.75, 'CGPA is honors standard (>= 3.75)');

// 2. Ongoing L-2 T-2 Courses
console.log('\nTest 2: Ongoing L-2 T-2 courses');
const ongoingCourses = getIpeCoursesForSemester('L2T2', true);
const theoryCourses = ongoingCourses.filter((c) => c.type === 'theory');
const sessionalCourses = ongoingCourses.filter((c) => c.type === 'sessional');
assert(theoryCourses.length === 5, 'L-2 T-2 has 5 theory courses (ME 243, ME 265, IPE 205, IPE 207, IPE 209)');
assert(sessionalCourses.length === 3, 'L-2 T-2 has 3 sessional courses (IPE 206, ME 244, ME 266)');
theoryCourses.forEach((c) => {
  assert(c.isOngoing === true, `${c.code} is ongoing`);
  assert(c.attendance !== undefined && c.attendance.totalConducted > 0, `${c.code} has attendance`);
  assert(c.classTests !== undefined && c.classTests.length === 3, `${c.code} has 3 CTs`);
});

// 3. Test Course Bridge Bidirectionality
console.log('\nTest 3: Course Bridge conversion');
const sampleAppCourse = theoryCourses[0];
const convertedStoreCourse = appCourseToStoreCourse(sampleAppCourse);
assert(convertedStoreCourse.code === sampleAppCourse.code, 'Code preserved in store course');
assert(convertedStoreCourse.termId === 'L-2 T-2', 'termId correctly mapped to L-2 T-2');
assert(convertedStoreCourse.attendance?.conducted === sampleAppCourse.attendance?.totalConducted, 'Attendance preserved');
assert(convertedStoreCourse.classTests?.length === sampleAppCourse.classTests?.length, 'CT array preserved');

const remappedAppCourse = storeCourseToAppCourse(convertedStoreCourse, 'L-2 T-2');
assert(remappedAppCourse.code === sampleAppCourse.code, 'Remapped course code matches');
assert(remappedAppCourse.isOngoing === true, 'Remapped course isOngoing is true for currentTermId');

const pastConverted = appCourseToStoreCourse(allPrevCourses[0]);
const pastRemapped = storeCourseToAppCourse(pastConverted, 'L-2 T-2');
assert(pastRemapped.isOngoing === false, 'Past course is marked !isOngoing');
assert(pastRemapped.gradePoint === allPrevCourses[0].gradePoint, 'Past course gradePoint preserved');

// 4. Test TermId and SemId mapping
console.log('\nTest 4: TermId <-> SemId conversion');
assert(termIdToSemId('L-2 T-2') === 'L2T2', 'L-2 T-2 -> L2T2');
assert(termIdToSemId('L-1 T-1') === 'L1T1', 'L-1 T-1 -> L1T1');
assert(semIdToTermId('L2T2') === 'L-2 T-2', 'L2T2 -> L-2 T-2');
assert(semIdToTermId('L1T1') === 'L-1 T-1', 'L1T1 -> L-1 T-1');

// 5. Test Routine generation and switching for all semesters
console.log('\nTest 5: Routine generation for all BUET semesters');
for (const sem of BUET_SEMESTERS) {
  const r = getIpeRoutineForSemester(sem.id);
  assert(r.title.includes(sem.shortLabel), `Routine title contains ${sem.shortLabel}: "${r.title}"`);
  assert(r.slots.length > 0, `${sem.shortLabel} routine has ${r.slots.length} scheduled slots`);
}

console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! No bugs or flaws found.');
