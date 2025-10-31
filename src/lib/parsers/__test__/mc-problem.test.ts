/**
 * Test file for MC problem parser
 * To run: node --loader ts-node/esm mc-problem.test.ts
 */

import { parseMCProblems, mcProblemsToJson } from '../mc-problem';

const sampleMarkdown = `
# Soal Pilihan Ganda

## $\\alpha$ Tauri merupakan bintang raksasa merah dengan luminositas $439\\ L_{\\odot}$ dan temperatur permukaan $3900\\ K$. Berapakah radius bintang ini?

### 12 $R_{\\odot}$

### 11 $R_{\\odot}$

### 9,5 $R_{\\odot}$

### 46,1 $R_{\\odot}$

### 8,7 $R_{\\odot}$

<solution_title> Jawaban: D

Dari persamaan luminositas bintang,

$$ L = 4\\pi R^{2}\\sigma T^{4},\\ \\ L \\propto R^{2}T^{4}$$

Kita dapat bandingkan dengan Matahari,

$$ \\frac{L}{L_{\\odot}} = \\left( \\frac{R}{R_{\\odot}} \\right)^{2}\\left( \\frac{T}{T_{\\odot}} \\right)^{4}$$

## Ketika pukul 12 malam waktu lokal, rasi bintang salib selatan terlihat terbalik. Diketahui rasi bintang ini berada pada asensio rekta 12h 30m dan deklinasi $- 60{^\\circ}$.

![Crux - Wikipedia](./media/media/image1.png)

Pada lintang berapakah penampakan langit seperti ini dapat terjadi?

### $$ \\phi < + 30{^\\circ}$$

### $$ \\phi < + 60{^\\circ}$$

### $$ \\phi < - 60{^\\circ}$$

### $$ \\phi < - 30{^\\circ}$$

### $$ \\phi = - 90{^\\circ}$$

<solution_title> Jawaban: D

Dalam pengamatan ini rasi bintang Crux haruslah bersifat sirkumpolar, karena dapat diamati dalam keadaan yang terbalik. Oleh karena itu, ini dapat diamati di lintang yang lebih selatan daripada $90 - |\\delta| = 30{^\\circ}$ lintang selatan.
`;

// Test the parser
console.log('Testing MC Problem Parser...\n');

try {
  const problems = parseMCProblems(sampleMarkdown);
  
  console.log(`✅ Parsed ${problems.length} problems\n`);
  
  problems.forEach((problem, index) => {
    console.log(`Problem ${index + 1}:`);
    console.log(`  Question: ${problem.question.substring(0, 80)}...`);
    console.log(`  Options: ${problem.options.length}`);
    console.log(`  Correct Answer: ${problem.correctAnswer}`);
    console.log(`  Question Images: ${problem.questionImages.length}`);
    console.log(`  Solution: ${problem.solution.substring(0, 80)}...`);
    console.log('');
  });
  
  // Test JSON conversion
  const json = mcProblemsToJson(problems);
  console.log('✅ JSON Conversion:');
  console.log(JSON.stringify(json, null, 2));
  
} catch (error) {
  console.error('❌ Test failed:', error);
}

