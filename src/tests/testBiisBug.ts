import { parseBIISText } from '../utils/biisParser';

const input = `CHEM 143	 Chemistry of Materials	
  2.00
    A-	
  3.50

 EEE 167	 Basic Electrical and Electronic Circuit	
4.00
    A+	
  4.00

 EEE 168	 Basic Electrical and Electronic Circuit Sessional	
1.50
    A+	
  4.00

 IPE 104	 Engineering Graphics	
1.50
    A+	
  4.00

 MATH 193	 Vector, Matrix and Solid Geometry	
4.00
    B+	
  3.25

 MME 195	 Engineering Materials I	
3.00
    C+	
  2.50

 PHY 102	 Physics Sessional	
1.50
    A-	
  3.50

 PHY 163	 Waves and Oscillations, Physical Optics and Wave Mechanics	
3.00
    B	
  3.00

 SHOP 160	 Foundry and Welding Shop	
0.75
    A+	
  4.00`;

console.log('Testing parseBIISText on new input...');
const result = parseBIISText(input);
console.log('Success:', result.success);
console.log('Courses count:', result.courses.length);
console.log('First course:', JSON.stringify(result.courses[0], null, 2));
console.log('All courses:', JSON.stringify(result.courses.map(c => ({ code: c.code, credits: c.credits, grade: c.grade, gp: c.gradePoint })), null, 2));
