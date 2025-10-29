/**
 * Parse essay problem sets from Markdown
 * 
 * Format:
 * # Problem Set Title (optional, will be skipped)
 * ## Problem Title
 * [Problem statement with paragraphs, images, LaTeX]
 * ### Subproblem 1
 * [Subproblem content]
 * ### Subproblem 2
 * [Subproblem content]
 * 
 * ## Next Problem
 * ...
 */

export interface Subproblem {
  title: string;
  content: string;
  images: string[];
}

export interface EssayProblem {
  title: string;
  problemStatement: string;
  subproblems: Subproblem[];
  images: string[];
}

/**
 * Extract images from markdown content
 */
function extractImages(content: string): string[] {
  const images: string[] = [];
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    images.push(match[2]); // Push the image path
  }
  
  return images;
}

/**
 * Parse essay problem set from Markdown
 * 
 * Structure:
 * - `# Problem Set Title` (optional, will be skipped)
 * - `## Problem Title` marks the start of a problem
 * - Problem statement is everything until first `###` or next `##`
 * - `### Subproblem Title` marks subproblems
 * - Each subproblem continues until next `###` or `##`
 */
export function parseEssayProblems(content: string): EssayProblem[] {
  const problems: EssayProblem[] = [];
  
  let processedContent = content.trim();
  
  // Find all `## ` markers (double ##, not # or ###)
  // Match `## ` at start of line (with optional leading whitespace/newline)
  const problemRegex = /^## ([^\n#]+)/gm;
  const allMatches = Array.from(processedContent.matchAll(problemRegex));
  
  if (allMatches.length === 0) {
    return [];
  }
  
  // The problem matches are all `## ` headings
  let problemMatches = allMatches;
  
  // Check if there's a single `# ` at the start (problem set title) and skip it
  const setTitleRegex = /^# ([^\n#]+)/gm;
  const setTitleMatch = processedContent.match(setTitleRegex);
  // If there's a single `# ` at the very start, it's the set title
  if (setTitleMatch && setTitleMatch.length > 0) {
    const firstSetTitleIndex = processedContent.indexOf(setTitleMatch[0]);
    // Only skip if it's at the start and there are actual problems
    if (firstSetTitleIndex < 50 && problemMatches.length > 0) {
      // Already handled - problemMatches uses `## ` so the `# ` title is automatically skipped
    }
  }
  
  if (problemMatches.length === 0) {
    return [];
  }
  
  for (let i = 0; i < problemMatches.length; i++) {
    const match = problemMatches[i];
    const problemStart = match.index!;
    const problemEnd = i < problemMatches.length - 1 
      ? problemMatches[i + 1].index!
      : processedContent.length;
    
    const problemSection = processedContent.substring(problemStart, problemEnd);
    const problemTitle = match[1].trim();
    
    // Find where the problem title line ends (after newline)
    const titleLineEnd = problemSection.indexOf('\n');
    const contentAfterTitle = titleLineEnd >= 0 
      ? problemSection.substring(titleLineEnd + 1)
      : '';
    
    // Find where subproblems start (marked with `###`)
    // Match `### ` at start of line (multiline mode)
    const subproblemRegex = /^### ([^\n]+)/gm;
    const subproblemMatches = Array.from(contentAfterTitle.matchAll(subproblemRegex));
    
    let problemStatementEnd: number;
    
    if (subproblemMatches.length > 0) {
      // Problem statement ends at first subproblem
      // The index is relative to contentAfterTitle, so we need to adjust
      problemStatementEnd = subproblemMatches[0].index!;
    } else {
      // No subproblems, problem statement is everything
      problemStatementEnd = contentAfterTitle.length;
    }
    
    // Extract problem statement
    let problemStatement = contentAfterTitle
      .substring(0, problemStatementEnd)
      .trim();
    
    // Extract subproblems
    const subproblems: Subproblem[] = [];
    
    for (let j = 0; j < subproblemMatches.length; j++) {
      const subMatch = subproblemMatches[j];
      const subTitle = subMatch[1].trim();
      const subStart = subMatch.index! + subMatch[0].length;
      const subEnd = j < subproblemMatches.length - 1
        ? subproblemMatches[j + 1].index!
        : contentAfterTitle.length;
      
      const subContent = contentAfterTitle
        .substring(subStart, subEnd)
        .trim();
      
      subproblems.push({
        title: subTitle,
        content: subContent,
        images: extractImages(subContent)
      });
    }
    
    // Extract images from problem statement
    const problemImages = extractImages(problemStatement);
    
    problems.push({
      title: problemTitle,
      problemStatement,
      subproblems,
      images: problemImages
    });
  }
  
  return problems;
}

/**
 * Convert essay problems to JSON format for storage
 */
export function essayProblemsToJson(problems: EssayProblem[]): any {
  return {
    type: 'essay-problem-set',
    problems: problems.map(p => ({
      title: p.title,
      problemStatement: p.problemStatement,
      subproblems: p.subproblems.map(s => ({
        title: s.title,
        content: s.content,
        images: s.images
      })),
      images: p.images
    }))
  };
}

