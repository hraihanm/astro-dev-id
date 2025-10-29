import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// Import the markdown parser
function parseMarkdownQuiz(content) {
  const questions = [];
  const questionBlocks = content.split(/^## /m).filter(Boolean);
  
  for (const block of questionBlocks) {
    const lines = block.trim().split('\n');
    
    // Extract question text (everything before first **)
    let questionText = '';
    let inQuestionText = true;
    
    // Extract type
    let type = '';
    let correctAnswer = '';
    let options = [];
    let tolerance = 0.01;
    
    const blocks = block.split(/\*\*/);
    
    // Find type and correct answer
    for (let i = 0; i < blocks.length; i++) {
      const section = blocks[i].trim();
      
      if (section.startsWith('Type:')) {
        type = section.split(':')[1].trim();
      } else if (section.startsWith('Correct Answer:') || section.startsWith('Correct Answers:')) {
        const answerPart = section.split(':')[1].trim();
        correctAnswer = answerPart.includes(',') 
          ? answerPart.split(',').map(a => parseInt(a.trim()))
          : parseInt(answerPart);
      } else if (section === 'Tolerance:') {
        tolerance = parseFloat(blocks[i + 1].trim());
      } else if (section === 'Options:') {
        // Parse options (next lines starting with numbers)
        const optionLines = blocks[i + 1].split('\n').filter(line => 
          /^\d+\./.test(line.trim())
        );
        options = optionLines.map(line => {
          const text = line.replace(/^\d+\.\s*/, '').trim();
          return text;
        });
        break;
      }
    }
    
    // Get question text (everything before Type:)
    const typeIndex = block.indexOf('**Type:**');
    questionText = block.substring(0, typeIndex).trim();
    
    const question = {
      id: questions.length + 1,
      type,
      question: questionText.replace(/^## /, ''),
      options,
      correctAnswer
    };
    
    if (type === 'number') {
      question.tolerance = tolerance;
    }
    
    questions.push(question);
  }
  
  return questions;
}

async function seedQuizzes() {
  const quizzesDir = path.join(__dirname, '..', 'sample-quizzes');
  const quizFiles = [
    'math-basics-quiz.md',
    'web-development-quiz.md',
    'general-knowledge-quiz.md'
  ];
  
  for (const file of quizFiles) {
    const filePath = path.join(quizzesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const questions = parseMarkdownQuiz(content);
    
    const title = file.replace('.md', '').replace(/-/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    console.log(`Creating quiz: ${title} with ${questions.length} questions`);
    
    await prisma.quiz.create({
      data: {
        courseId: null, // Standalone quiz
        title,
        questions: JSON.stringify(questions),
        settings: JSON.stringify({
          description: `A standalone practice quiz on ${title.toLowerCase()}`,
          timeLimit: 1800, // 30 minutes
          maxAttempts: 3
        })
      }
    });
  }
}

seedQuizzes()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

