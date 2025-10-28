/**
 * Parse Markdown quiz files into system-compatible format
 * Supports simple and complex multiple choice questions
 */

export interface QuizQuestion {
  id: number;
  type: 'multiple-choice' | 'complex-multiple-choice' | 'text' | 'number';
  question: string;
  options: string[];
  correctAnswer: number | number[];  // number for simple, array for complex
  images?: string[];
  metadata?: {
    category?: string;
    difficulty?: string;
  };
}

/**
 * Parse Markdown quiz content into structured questions
 * 
 * Format:
 * ## Question 1
 * [Question text]
 * 
 * **Type:** simple
 * **Correct Answer:** 2
 * 
 * **Options:**
 * 1. Option A
 * 2. Option B
 * ...
 */
export function parseMarkdownQuiz(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  
  // Split by ## headers (question separators)
  const questionBlocks = content.split(/^## /gm).filter(block => block.trim());
  
  for (const [index, block] of questionBlocks.entries()) {
    if (!block.includes('Question')) continue;
    
    try {
      // Extract question text (before "Type:" or "Correct Answer:")
      const textMatch = block.match(/Question[\d:]*\s*([\s\S]*?)(?=\*\*\s*(Type|Correct Answer):)/);
      if (!textMatch) continue;
      
      const questionText = textMatch[1].trim();
      
      // Extract type (default to simple)
      const typeMatch = block.match(/\*\*Type:\*\*\s*(simple|complex)/);
      const questionType = typeMatch ? typeMatch[1] : 'simple';
      
      // Extract correct answer(s)
      const correctAnswerMatch = block.match(/\*\*Correct Answer[s]?:\*\*\s*([0-9,\s]+)/);
      if (!correctAnswerMatch) continue;
      
      const correctAnswers = correctAnswerMatch[1]
        .split(',')
        .map(s => parseInt(s.trim()))
        .filter(n => !isNaN(n));
      
      if (correctAnswers.length === 0) continue;
      
      // Determine if simple or complex
      const isSimple = questionType === 'simple' || correctAnswers.length === 1;
      
      // Extract options
      const options: string[] = [];
      const optionRegex = /^\d+\.\s*(.+)$/gm;
      const optionMatches = block.matchAll(optionRegex);
      
      for (const match of optionMatches) {
        options.push(match[1].trim());
      }
      
      if (options.length === 0) continue;
      
      // Extract images
      const images: string[] = [];
      const imageRegex = /!\[[^\]]*\]\(([^)]+)\)/g;
      const imageMatches = block.matchAll(imageRegex);
      for (const match of imageMatches) {
        images.push(match[1]);
      }
      
      questions.push({
        id: index,
        type: isSimple ? 'multiple-choice' : 'complex-multiple-choice',
        question: questionText,
        options,
        correctAnswer: isSimple ? correctAnswers[0] : correctAnswers,
        images
      });
    } catch (error) {
      console.error(`Error parsing question ${index + 1}:`, error);
      continue;
    }
  }
  
  return questions;
}

/**
 * Convert Indonesian format to Markdown format
 */
export function convertIndonesianToMarkdown(indonesianContent: string): string {
  let markdown = '';
  let questionCounter = 1;
  
  // Split by question markers
  const questionBlocks = indonesianContent.split('%ModelSoal-PGK%').filter(block => block.trim());
  
  for (const block of questionBlocks) {
    // Extract question text (before first OPTK)
    const questionMatch = block.match(/^([\s\S]*?)(?=%OPT|$)/);
    if (!questionMatch) continue;
    
    const questionText = questionMatch[1].trim();
    
    // Extract options
    const options: string[] = [];
    const optionPatterns = [
      { pattern: /%OPTK1[^%]+%\s*([\s\S]*?)(?=%OPTK2|%doc|$)/, index: 0 },
      { pattern: /%OPTK2[^%]+%\s*([\s\S]*?)(?=%OPTK3|%doc|$)/, index: 1 },
      { pattern: /%OPTK3[^%]+%\s*([\s\S]*?)(?=%OPTK4|%doc|$)/, index: 2 },
      { pattern: /%OPTK4[^%]+%\s*([\s\S]*?)(?=%OPTK5|%doc|$)/, index: 3 },
      { pattern: /%OPTK5[^%]+%\s*([\s\S]*?)(?=%doc|$)/, index: 4 }
    ];
    
    for (const { pattern } of optionPatterns) {
      const match = block.match(pattern);
      if (match) {
        const optionText = match[1].trim();
        options.push(optionText);
      }
    }
    
    // Build Markdown
    markdown += `## Question ${questionCounter++}\n\n`;
    markdown += questionText + '\n\n';
    markdown += '**Type:** simple\n';
    markdown += '**Correct Answer:** 1\n'; // You'll need to specify correct answer
    markdown += '\n**Options:**\n';
    
    options.forEach((option, idx) => {
      markdown += `${idx + 1}. ${option}\n`;
    });
    
    markdown += '\n---\n\n';
  }
  
  return markdown;
}

