import { convertDocxToMarkdown, testDocxConversion } from '../lib/docx-converter.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test DOCX conversion
async function main() {
  const testDocxPath = path.join(__dirname, '..', 'test-document.docx');
  
  try {
    await testDocxConversion(testDocxPath);
  } catch (error) {
    console.log('No test DOCX file found. Create a test-document.docx in the project root to test conversion.');
    console.log('Example usage:');
    console.log('1. Place your DOCX file in the project root');
    console.log('2. Run: node scripts/test-docx-conversion.js');
    console.log('3. Check the generated .md file');
  }
}

main().catch(console.error);
