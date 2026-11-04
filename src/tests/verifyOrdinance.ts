import {
  calculateAttendance,
  calculateClassTests,
  evaluateCourseAssessment,
  calculateGPA,
} from '../utils/buetOrdinance';
import { parseBIISText } from '../utils/biisParser';
import { Course } from '../types';

console.log('=== Running BUETracker Ordinance & Engine Verification ===\n');

// 1. Attendance Test
console.log('--- 1. Testing Attendance Engine ---');
const att92 = calculateAttendance(3.0, 26, 24); // 92.3%
console.log(`92.3% Attendance: Percentage=${att92.percentage}%, SlabPoints=${att92.slabPoints}, AttMarks=${att92.attendanceMarks}/${att92.maxAttendanceMarks}, NonCollegiate=${att92.isNonCollegiate}, SafeBunksTo60=${att92.safeBunksTo60}`);
if (att92.slabPoints !== 10 || att92.attendanceMarks !== 30 || att92.isNonCollegiate !== false) {
  throw new Error('Attendance test failed for 92.3%');
}

const att58 = calculateAttendance(3.0, 26, 15); // 57.69% -> Non-Collegiate
console.log(`57.7% Attendance: Percentage=${att58.percentage}%, SlabPoints=${att58.slabPoints}, NonCollegiate=${att58.isNonCollegiate}, SafeBunksTo60=${att58.safeBunksTo60}`);
if (att58.slabPoints !== 0 || att58.isNonCollegiate !== true) {
  throw new Error('Attendance test failed for Non-Collegiate');
}

const att80 = calculateAttendance(3.0, 26, 21); // 80.7% -> Slab 8/10
console.log(`80.7% Attendance: Percentage=${att80.percentage}%, SlabPoints=${att80.slabPoints}, ClassesNeededForNext=${att80.classesNeededForNextSlab}`);
if (att80.slabPoints !== 8 || att80.classesNeededForNextSlab === null || att80.classesNeededForNextSlab <= 0) {
  throw new Error('Attendance test failed for 80.7%');
}
console.log('✓ Attendance Engine verified!\n');

// 2. Class Test (CT) Best n of n+1 Test
console.log('--- 2. Testing Class Test (CT) Engine ---');
const cts = [
  { id: '1', name: 'CT 1', obtainedMarks: 17, maxMarks: 20 },
  { id: '2', name: 'CT 2', obtainedMarks: 18.5, maxMarks: 20 },
  { id: '3', name: 'CT 3', obtainedMarks: 14, maxMarks: 20 },
  { id: '4', name: 'CT 4', obtainedMarks: 19, maxMarks: 20 },
];
// For 3-credit course, best 3 of 4: top 3 are 19, 18.5, 17 = 54.5 / 60
const ctResult = calculateClassTests(3.0, cts);
console.log(`Best 3 of 4 CTs: Total=${ctResult.totalCTMarks}/${ctResult.maxCTMarks}, Mean%=${ctResult.ctPercentage}%`);
const dropped = ctResult.tests.filter(t => !t.isCounted);
console.log(`Dropped CT: ${dropped.map(d => `${d.name} (${d.obtainedMarks})`).join(', ')}`);
if (ctResult.totalCTMarks !== 54.5 || ctResult.maxCTMarks !== 60 || dropped.length !== 1 || dropped[0].obtainedMarks !== 14) {
  throw new Error('Class test best n calculation failed');
}

// Custom override test: Best 2 of 4
const ctOverride = calculateClassTests(3.0, cts, true, 2);
console.log(`Manual Override Best 2 of 4: Total=${ctOverride.totalCTMarks}/${ctOverride.maxCTMarks}`);
if (ctOverride.totalCTMarks !== 37.5) { // 19 + 18.5 = 37.5
  throw new Error('Class test manual override failed');
}
console.log('✓ Class Test Engine verified!\n');

// 3. Term Final Target Matrix Test
console.log('--- 3. Testing Term Final (TF) Target Matrix & Sec A/B Split ---');
const sampleCourse: Course = {
  id: 'c1',
  code: 'ME 243',
  title: 'Mechanics of Solids',
  nickname: 'Solid Mech',
  credits: 3.0,
  type: 'theory',
  semesterId: 'L2T1',
  color: '#dc2626',
  isOngoing: true,
  attendance: { totalConducted: 26, attended: 24 }, // Att marks = 30 / 30
  classTests: cts, // CT marks = 54.5 / 60
};

const assessment = evaluateCourseAssessment(sampleCourse);
console.log(`Continuous Marks Obtained: ${assessment.continuousMarksObtained} / ${assessment.maxContinuousMarks} (30% weight)`);
console.log(`Max TF Marks: ${assessment.maxTFMarks} (70% weight, 70 * 3 = 210)`);

// For A+ (80%): Total required = 80% * 300 = 240.
// Continuous obtained = 30 + 54.5 = 84.5.
// Required in TF = 240 - 84.5 = 155.5 out of 210.
// Percentage in TF = 155.5 / 210 = 74.05%.
// Section A target = 155.5 / 2 = 77.75 out of 105.
// Section B target = 77.75 out of 105.
const targetAPlus = assessment.tfTargets.find(t => t.grade === 'A+');
console.log(`Target A+: Required Total=${targetAPlus?.requiredCourseMarks}, Needed in TF=${targetAPlus?.requiredTFMarks}/${targetAPlus?.maxTFMarks} (${targetAPlus?.requiredTFPercentage}%), Sec A=${targetAPlus?.targetSectionA}, Sec B=${targetAPlus?.targetSectionB}, Status=${targetAPlus?.status}`);

if (!targetAPlus || targetAPlus.requiredTFMarks !== 155.5 || targetAPlus.targetSectionA !== 77.75 || targetAPlus.targetSectionB !== 77.75) {
  throw new Error('Term final target calculation failed for A+');
}
console.log('✓ Term Final Targets & Section A/B split verified!\n');

// 4. BIIS Parser Test
console.log('--- 4. Testing BIIS Grade Sheet Text Parser ---');
const biisSample = `
Course No    Course Title                             Credit   Grade   Grade Point
ME 243       Mechanics of Solids                      3.00     A+      4.00
ME 265       Thermal Engineering and Heat Transfer    3.00     A       3.75
IPE 205      Manufacturing Processes I                3.00     A-      3.50
ME 244       Mechanics of Solids Sessional            0.75     A+      4.00
`;

const parseResult = parseBIISText(biisSample);
console.log(`Parsed Courses Count: ${parseResult.courses.length}, Total Credits: ${parseResult.totalCredits}, Term GPA: ${parseResult.termGpa}`);
parseResult.courses.forEach(c => {
  console.log(`  - ${c.code}: ${c.title} | ${c.credits} cr | ${c.grade} (${c.gradePoint}) | Type: ${c.type}`);
});

if (parseResult.courses.length !== 4) {
  throw new Error(`Expected 4 parsed courses, got ${parseResult.courses.length}`);
}
if (parseResult.courses[0].code !== 'ME 243' || parseResult.courses[0].grade !== 'A+' || parseResult.courses[0].gradePoint !== 4.0) {
  throw new Error('Course 1 parsing mismatch');
}
if (parseResult.courses[3].code !== 'ME 244' || parseResult.courses[3].type !== 'sessional') {
  throw new Error('Sessional course identification mismatch');
}
console.log('✓ BIIS Parser verified!\n');

console.log('========================================================');
console.log('🎉 ALL BUET ORDINANCE ENGINES & PARSERS PASSED 100%! 🎉');
console.log('========================================================');

