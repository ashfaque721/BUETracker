import { parseBIISText } from '../utils/biisParser';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion failed: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`✅ ${msg}`);
}

const testInput = `
 CHEM 114	 Inorganic Quantitative Analysis Sessional	
1.50
    A	
  3.75

 CHEM 119	 Chemistry - I	
3.00
    B+	
  3.25

 HUM 102	 English Language Practice	
1.50
    A-	
  3.50

 HUM 211	 Sociology	
2.00
    A+	
  4.00

 IPE 105	 Principles of Cost and Management Accounting	
3.00
    A	
  3.75

 MATH 191	 Differential and Integral Calculus	
4.00
    A+	
  4.00

 ME 160	 Mechanical Engineering Drawing - I	
1.50
    A	
  3.75

 PHY 117	 Structure of Matter, Electricity, Magnetism and Modern Physics	
3.00
    B-	
  2.75

 SHOP 170	 Machine Shop	
0.75
    A+	
  4.00
`;

console.log('=== TEST: BIIS Multi-Line & Multi-Cell Parsing ===\n');
const result = parseBIISText(testInput);

assert(result.success, 'Parser returned success = true');
assert(result.courses.length === 9, 'All 9 courses detected');
assert(result.totalCredits === 20.25, `Total credits equals 20.25 (got ${result.totalCredits})`);
assert(result.termGpa === 3.59, `Term GPA equals 3.59 (got ${result.termGpa})`);

const expected = [
  { code: 'CHEM 114', credits: 1.5, grade: 'A', gradePoint: 3.75, type: 'sessional' },
  { code: 'CHEM 119', credits: 3.0, grade: 'B+', gradePoint: 3.25, type: 'theory' },
  { code: 'HUM 102', credits: 1.5, grade: 'A-', gradePoint: 3.50, type: 'sessional' },
  { code: 'HUM 211', credits: 2.0, grade: 'A+', gradePoint: 4.00, type: 'theory' },
  { code: 'IPE 105', credits: 3.0, grade: 'A', gradePoint: 3.75, type: 'theory' },
  { code: 'MATH 191', credits: 4.0, grade: 'A+', gradePoint: 4.00, type: 'theory' },
  { code: 'ME 160', credits: 1.5, grade: 'A', gradePoint: 3.75, type: 'sessional' },
  { code: 'PHY 117', credits: 3.0, grade: 'B-', gradePoint: 2.75, type: 'theory' },
  { code: 'SHOP 170', credits: 0.75, grade: 'A+', gradePoint: 4.00, type: 'sessional' },
];

expected.forEach((exp) => {
  const c = result.courses.find((x) => x.code === exp.code);
  assert(!!c, `Found course ${exp.code}`);
  assert(c!.credits === exp.credits, `${exp.code} credits: expected ${exp.credits}, got ${c!.credits}`);
  assert(c!.grade === exp.grade, `${exp.code} grade: expected ${exp.grade}, got ${c!.grade}`);
  assert(c!.gradePoint === exp.gradePoint, `${exp.code} gradePoint: expected ${exp.gradePoint}, got ${c!.gradePoint}`);
  assert(c!.type === exp.type, `${exp.code} type: expected ${exp.type}, got ${c!.type}`);
});

console.log('\n=== TEST: Single-Line BIIS Format (Regression Check) ===');
const singleLineInput = `
ME 243 Mechanics of Solids 3.00 A+ 4.00
ME 265 Thermal Engineering and Heat Transfer 3.00 A 3.75
IPE 205 Manufacturing Processes I 3.00 A+ 4.00
`;
const singleResult = parseBIISText(singleLineInput);
assert(singleResult.courses.length === 3, 'Single line parsed 3 courses');
assert(singleResult.courses[0].grade === 'A+' && singleResult.courses[0].gradePoint === 4.0, 'ME 243 is A+ 4.0');
assert(singleResult.courses[1].grade === 'A' && singleResult.courses[1].gradePoint === 3.75, 'ME 265 is A 3.75');

console.log('\n🎉 ALL MULTI-LINE AND SINGLE-LINE BIIS PARSING TESTS PASSED!');

