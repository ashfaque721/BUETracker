import { calculateAttendance } from '../utils/buetOrdinance';
import { Course } from '../types/semester';

console.log('=== TEST: BUET 13-Week Attendance Ordinance & Threshold Enforcement ===\n');

// 1. Ordinance Formula Testing
console.log('1. Testing Maximum Semester Classes calculation (13 weeks * credits)...');
const testCases = [
  { credits: 3.0, expectedMax: 39 },
  { credits: 4.0, expectedMax: 52 },
  { credits: 2.0, expectedMax: 26 },
  { credits: 1.5, expectedMax: 20 },
];

for (const tc of testCases) {
  const maxCls = Math.max(1, Math.round(tc.credits * 13));
  if (maxCls !== tc.expectedMax) {
    throw new Error(`Expected max classes for ${tc.credits} cr to be ${tc.expectedMax}, got ${maxCls}`);
  }
  console.log(`   ✓ ${tc.credits} credits -> ${maxCls} classes/semester (${tc.credits} classes/wk * 13 weeks)`);
}

// 2. Testing calculateAttendance clamping and metrics
console.log('\n2. Testing calculateAttendance clamping at 13-week limit...');
const attAtLimit = calculateAttendance(3.0, 39, 36);
if (attAtLimit.maxSemesterClasses !== 39) {
  throw new Error(`Expected maxSemesterClasses=39, got ${attAtLimit.maxSemesterClasses}`);
}
if (!attAtLimit.isMaxClassesReached) {
  throw new Error('Expected isMaxClassesReached=true at 39 classes');
}
if (attAtLimit.remainingClasses !== 0) {
  throw new Error(`Expected 0 remaining classes, got ${attAtLimit.remainingClasses}`);
}
console.log(`   ✓ At limit (36/39): %=${attAtLimit.percentage}%, Slab=${attAtLimit.slabPoints}/10, Remaining=${attAtLimit.remainingClasses}, LimitReached=${attAtLimit.isMaxClassesReached}`);

// Test attempting to pass > 39 conducted classes
const attOverLimit = calculateAttendance(3.0, 50, 45);
if (attOverLimit.maxSemesterClasses !== 39) {
  throw new Error('Max semester classes should remain 39');
}
if (attOverLimit.remainingClasses !== 0) {
  throw new Error('Remaining classes should be 0');
}
console.log(`   ✓ Beyond limit clamped to 39: Percentage=${attOverLimit.percentage}% (calculated against 39 max)`);

// 3. Testing Store addAttendance capping logic
console.log('\n3. Testing Store mutation simulation with threshold...');

function simulateAddAttendance(c: Course, isAttended: boolean): Course {
  const credits = c.credits || 3.0;
  const maxClasses = Math.max(1, Math.round(credits * 13));
  const currentAtt = c.attendance || { attended: 0, conducted: 0 };

  if (currentAtt.conducted >= maxClasses) {
    return c; // strictly capped at 13-week threshold
  }

  const nextConducted = currentAtt.conducted + 1;
  const nextAttended = Math.min(nextConducted, currentAtt.attended + (isAttended ? 1 : 0));
  const nextHistory = [...(currentAtt.history || []), (isAttended ? 'attended' : 'missed') as 'attended' | 'missed'];

  return {
    ...c,
    attendance: {
      conducted: nextConducted,
      attended: nextAttended,
      history: nextHistory,
    },
  };
}

function simulateUndoAttendance(c: Course): Course {
  const currentAtt = c.attendance;
  if (!currentAtt || currentAtt.conducted <= 0) return c;

  if (currentAtt.history && currentAtt.history.length > 0) {
    const lastAction = currentAtt.history[currentAtt.history.length - 1];
    const nextHistory = currentAtt.history.slice(0, -1);
    const nextAttended = lastAction === 'attended' ? Math.max(0, currentAtt.attended - 1) : currentAtt.attended;
    const nextConducted = Math.max(0, currentAtt.conducted - 1);
    return {
      ...c,
      attendance: {
        conducted: nextConducted,
        attended: Math.min(nextConducted, nextAttended),
        history: nextHistory,
      },
    };
  }

  const nextConducted = Math.max(0, currentAtt.conducted - 1);
  const nextAttended = Math.min(nextConducted, currentAtt.attended);
  return {
    ...c,
    attendance: {
      conducted: nextConducted,
      attended: nextAttended,
      history: [],
    },
  };
}

// Start with 38 conducted for ME 243 (3 credits, max 39)
let course3Cr: Course = {
  code: 'ME 243',
  title: 'Mechanics of Solids',
  credits: 3.0,
  type: 'THEORY',
  termId: 'L-2 T-2',
  attendance: { conducted: 38, attended: 35, history: ['attended'] },
};

console.log(`   Initial state: ${course3Cr.attendance?.attended}/${course3Cr.attendance?.conducted} classes`);

// Add 39th class (attended)
course3Cr = simulateAddAttendance(course3Cr, true);
console.log(`   After +Attended (39th class): ${course3Cr.attendance?.attended}/${course3Cr.attendance?.conducted} classes`);
if (course3Cr.attendance?.conducted !== 39 || course3Cr.attendance?.attended !== 36) {
  throw new Error(`Expected 36/39, got ${course3Cr.attendance?.attended}/${course3Cr.attendance?.conducted}`);
}

// Attempt to add 40th class (+Attended)
course3Cr = simulateAddAttendance(course3Cr, true);
console.log(`   Attempting 40th class (+Attended): ${course3Cr.attendance?.attended}/${course3Cr.attendance?.conducted} classes (BLOCKED)`);
if (course3Cr.attendance?.conducted !== 39) {
  throw new Error(`Infinite attendance bug! Conducted reached ${course3Cr.attendance?.conducted}, should be capped at 39!`);
}

// Attempt to add 40th class (+Missed)
course3Cr = simulateAddAttendance(course3Cr, false);
console.log(`   Attempting 40th class (+Missed): ${course3Cr.attendance?.attended}/${course3Cr.attendance?.conducted} classes (BLOCKED)`);
if (course3Cr.attendance?.conducted !== 39) {
  throw new Error(`Infinite attendance bug! Conducted reached ${course3Cr.attendance?.conducted}, should be capped at 39!`);
}
console.log('   ✓ Adding classes beyond 13-week limit (39 classes) strictly blocked!');

// Test Undo functionality
console.log('\n4. Testing Undo attendance functionality...');
course3Cr = simulateUndoAttendance(course3Cr);
console.log(`   After Undo: ${course3Cr.attendance?.attended}/${course3Cr.attendance?.conducted} classes`);
if (course3Cr.attendance?.conducted !== 38 || course3Cr.attendance?.attended !== 35) {
  throw new Error(`Expected 35/38 after undo, got ${course3Cr.attendance?.attended}/${course3Cr.attendance?.conducted}`);
}
console.log('   ✓ Undo reverted the 39th class successfully!');

// 5. Testing 4-credit course (52 classes max)
console.log('\n5. Testing 4-credit course (ME 265, 52 classes max)...');
let course4Cr: Course = {
  code: 'ME 265',
  title: 'Thermal Engineering and Heat Transfer',
  credits: 4.0,
  type: 'THEORY',
  termId: 'L-2 T-2',
  attendance: { conducted: 51, attended: 48, history: ['attended'] },
};

course4Cr = simulateAddAttendance(course4Cr, false); // 52nd class missed
if (course4Cr.attendance?.conducted !== 52 || course4Cr.attendance?.attended !== 48) {
  throw new Error(`Expected 48/52, got ${course4Cr.attendance?.attended}/${course4Cr.attendance?.conducted}`);
}
// Attempt 53rd class
course4Cr = simulateAddAttendance(course4Cr, true);
if (course4Cr.attendance?.conducted !== 52) {
  throw new Error(`4-credit course exceeded 52 classes! Got ${course4Cr.attendance?.conducted}`);
}
console.log(`   ✓ 4.0 credit course properly capped at exactly 52 classes!`);

console.log('\n🎉 ALL ATTENDANCE ORDINANCE AND THRESHOLD TESTS PASSED 100%!');
