/**
 * Parse multiple choice problem sets from Markdown
 * 
 * Format:
 * # Problem Set Title (optional, will be skipped)
 * ## Question 1
 * [Question text with optional LaTeX and images]
 * ### Option A
 * ### Option B
 * ### Option C
 * ### Option D
 * ### Option E
 * <solution_title> Jawaban: C
 * [Solution explanation]
 * 
 * ## Question 2
 * ...
 */

export interface MCOption {
  text: string;
  images?: string[]; // Deprecated: kept for backward compatibility, images now in text
}

export interface MCProblem {
  question: string;
  questionImages?: string[]; // Deprecated: kept for backward compatibility, images now in text
  options: MCOption[];
  correctAnswer: string; // The letter after "Jawaban: "
  solution: string;
  solutionImages?: string[]; // Deprecated: kept for backward compatibility, images now in text
}

/**
 * Extract images from markdown content (for backward compatibility)
 * Now images are preserved in text as markdown syntax
 */
function extractImages(content: string): { content: string; images: string[] } {
  // Keep images in content - don't extract them anymore
  // This function is kept for backward compatibility but now preserves images in text
  const images: string[] = [];
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)(\{[^}]+\})?/g;
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[2]); // Track images for backward compatibility
    // Don't remove images from content - keep them as markdown
  }
  
  return { content: content.trim(), images };
}

/**
 * Parse multiple choice problems from Markdown
 * 
 * Structure:
 * - `# Problem Set Title` (optional, will be skipped)
 * - `## Question` marks the start of a question
 * - Question text is everything until first `###`
 * - `### Option Text` marks each option
 * - `<solution_title> Jawaban: X` marks the solution section
 * - Solution continues until next `##` or end
 */
export function parseMCProblems(content: string): MCProblem[] {
  const problems: MCProblem[] = [];
  
  let processedContent = content.trim();
  
  // Find all `## ` markers (questions)
  const questionRegex = /^## ([^\n]+)/gm;
  const questionMatches = Array.from(processedContent.matchAll(questionRegex));
  
  if (questionMatches.length === 0) {
    return [];
  }
  
  for (let i = 0; i < questionMatches.length; i++) {
    const match = questionMatches[i];
    const questionStart = match.index!;
    const questionEnd = i < questionMatches.length - 1 
      ? questionMatches[i + 1].index!
      : processedContent.length;
    
    const questionSection = processedContent.substring(questionStart, questionEnd);
    
    try {
      // Parse the question section
      const problem = parseQuestionSection(questionSection);
      if (problem) {
        problems.push(problem);
      }
    } catch (error) {
      console.error(`Error parsing question ${i + 1}:`, error);
      continue;
    }
  }
  
  return problems;
}

/**
 * Parse a single question section
 */
function parseQuestionSection(section: string): MCProblem | null {
  // Extract the question text from the ## line
  const questionLineMatch = section.match(/^##\s+(.*)$/m);
  if (!questionLineMatch) {
    console.warn('No question line found');
    return null;
  }
  const questionLineText = questionLineMatch[1].trim();
  
  // Get content after the ## line
  const titleLineEnd = section.indexOf('\n');
  const contentAfterTitle = titleLineEnd >= 0 
    ? section.substring(titleLineEnd + 1).trim()
    : '';
  
  // Find options (marked with `###`)
  const optionRegex = /^### ([^\n]+)/gm;
  const optionMatches = Array.from(contentAfterTitle.matchAll(optionRegex));
  
  if (optionMatches.length === 0) {
    console.warn('No options found in question');
    return null;
  }
  
  // Find solution marker
  const solutionMarkerRegex = /<solution_title>\s*Jawaban:\s*([A-Ea-e])/;
  const solutionMatch = contentAfterTitle.match(solutionMarkerRegex);
  
  if (!solutionMatch) {
    console.warn('No solution marker found');
    return null;
  }
  
  const correctAnswer = solutionMatch[1].toUpperCase();
  const solutionStartIndex = solutionMatch.index! + solutionMatch[0].length;
  
  // Extract question text (text from ## line + content before first option)
  const questionEnd = optionMatches[0].index!;
  const questionBodyText = contentAfterTitle.substring(0, questionEnd).trim();
  
  // Combine question line text with any additional content before options
  const questionTextRaw = questionBodyText 
    ? `${questionLineText}\n\n${questionBodyText}` 
    : questionLineText;
  
  const { content: questionText, images: questionImages } = extractImages(questionTextRaw);
  
  // Extract options
  const options: MCOption[] = [];
  
  for (let j = 0; j < optionMatches.length; j++) {
    const optMatch = optionMatches[j];
    // The option text is captured in the regex match group
    const optionTextRaw = optMatch[1].trim();
    const { content: optionText, images: optionImages } = extractImages(optionTextRaw);
    
    options.push({
      text: optionText,
      images: optionImages
    });
  }
  
  // Extract solution text
  const solutionTextRaw = contentAfterTitle.substring(solutionStartIndex).trim();
  const { content: solutionText, images: solutionImages } = extractImages(solutionTextRaw);
  
  return {
    question: questionText, // Images are now embedded in questionText as markdown
    questionImages, // Kept for backward compatibility
    options,
    correctAnswer,
    solution: solutionText, // Images are now embedded in solutionText as markdown
    solutionImages // Kept for backward compatibility
  };
}

/**
 * Convert MC problems to JSON format for storage
 */
export function mcProblemsToJson(problems: MCProblem[]): any {
  return {
    type: 'multiple-choice-problem-set',
    problems: problems.map((p, index) => ({
      id: index + 1,
      question: p.question,
      questionImages: p.questionImages,
      options: p.options.map((opt, optIndex) => ({
        id: String.fromCharCode(65 + optIndex), // A, B, C, D, E
        text: opt.text,
        images: opt.images
      })),
      correctAnswer: p.correctAnswer,
      solution: p.solution,
      solutionImages: p.solutionImages
    }))
  };
}

