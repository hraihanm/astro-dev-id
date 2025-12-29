import { prisma } from './db';
import { compareMathExpressions } from './math-symbolic';

export interface QuizAnswer {
  questionId: number;
  type: string;
  answer: any[];
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  percentage: number;
  timeSpent: number;
  detailedResults: QuestionResult[];
}

export interface QuestionResult {
  questionId: number;
  question: any;
  userAnswer: any[];
  correctAnswer: any;
  isCorrect: boolean;
  points: number;
  maxPoints: number;
}

function normalizeOption(val: any): number {
  const n = parseInt(val);
  if (Number.isNaN(n)) return 0;
  // UI submits options as 1-based (1..N). Some quizzes may store 0-based.
  // Normalize stored correct answers to 1-based for comparison.
  return n <= 0 ? n + 1 : n;
}

function normalizeArrayOptions(arr: any[]): number[] {
  return arr.map((v) => normalizeOption(v));
}

export async function calculateScore(questions: any[], answers: QuizAnswer[]): Promise<QuizResult> {
  let correctAnswers = 0;
  let totalPoints = 0;
  let earnedPoints = 0;
  const detailedResults: QuestionResult[] = [];

  for (const [index, question] of questions.entries()) {
    const userAnswer = answers.find(a => a.questionId === index);
    const questionResult = await evaluateQuestion(question, userAnswer);
    
    detailedResults.push(questionResult);
    
    if (questionResult.isCorrect) {
      correctAnswers++;
    }
    
    totalPoints += questionResult.maxPoints;
    earnedPoints += questionResult.points;
  }

  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  
  return {
    score: earnedPoints,
    totalQuestions: questions.length,
    correctAnswers,
    incorrectAnswers: questions.length - correctAnswers,
    percentage,
    timeSpent: 0,
    detailedResults
  };
}

async function evaluateQuestion(question: any, userAnswer?: QuizAnswer): Promise<QuestionResult> {
  const maxPoints = 1;
  let points = 0;
  let isCorrect = false;

  if (!userAnswer) {
    return {
      questionId: question.id || 0,
      question,
      userAnswer: [],
      correctAnswer: question.correctAnswer || question.correctAnswers || null,
      isCorrect: false,
      points: 0,
      maxPoints
    };
  }

  switch (question.type) {
    case 'multiple-choice': {
      const userVal = normalizeOption(userAnswer.answer[0]);
      const correctVal = normalizeOption(question.correctAnswer);
      isCorrect = userVal === correctVal;
      points = isCorrect ? maxPoints : 0;
      break;
    }
      
    case 'multiple-select': {
      const userSelections = normalizeArrayOptions(userAnswer.answer).sort();
      const correctSelections = Array.isArray(question.correctAnswer) 
        ? normalizeArrayOptions(question.correctAnswer).sort()
        : normalizeArrayOptions([question.correctAnswer]).sort();
      isCorrect = JSON.stringify(userSelections) === JSON.stringify(correctSelections);
      points = isCorrect ? maxPoints : 0;
      break;
    }
      
    case 'complex-multiple-choice':
      points = evaluateComplexMultipleChoice(question, userAnswer);
      // For complex MC, "correct" means points > 0
      isCorrect = points > 0;
      break;
      
    case 'text':
      const userText = (userAnswer.answer[0] || '').toString().toLowerCase().trim();
      const correctText = question.correctAnswer.toString().toLowerCase().trim();
      isCorrect = userText === correctText;
      points = isCorrect ? maxPoints : 0;
      break;
      
    case 'number':
      const userNumber = parseFloat(userAnswer.answer[0]);
      const correctNumber = parseFloat(question.correctAnswer);
      const tolerance = question.tolerance || 0.01;
      isCorrect = Math.abs(userNumber - correctNumber) <= tolerance;
      points = isCorrect ? maxPoints : 0;
      break;
    
    case 'essay':
      // Essays require manual grading - return 0 points for now
      // Can be manually graded later by instructor
      points = 0;
      isCorrect = false;
      break;
    
    case 'fill-in-the-blank':
      points = await evaluateFillInTheBlank(question, userAnswer);
      isCorrect = points === maxPoints;
      break;
  }

  return {
    questionId: question.id || 0,
    question,
    userAnswer: userAnswer.answer,
    correctAnswer: question.correctAnswer || question.correctAnswers || question.blanks || null,
    isCorrect,
    points,
    maxPoints
  };
}

/**
 * Evaluate penalty-based scoring for complex multiple choice questions
 * Formula: Score = (correct / N) - (incorrect / N), minimum 0
 */
function evaluateComplexMultipleChoice(question: any, userAnswer: QuizAnswer): number {
  // Ensure correctAnswer is array - support both correctAnswer and correctAnswers
  const correctAnswers = Array.isArray(question.correctAnswers)
    ? question.correctAnswers
    : (Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [question.correctAnswer]);
  
  const N = correctAnswers.length; // Number of correct answers
  if (N === 0) return 0;
  
  // Convert to sorted number arrays for comparison
  const userSelections = userAnswer.answer.map((a: any) => normalizeOption(a)).sort();
  const correctSelections = correctAnswers.map((a: any) => normalizeOption(a)).sort();
  
  // Count correct and incorrect selections
  let correctCount = 0;
  let incorrectCount = 0;
  
  for (const selection of userSelections) {
    if (correctSelections.includes(selection)) {
      correctCount++;
    } else {
      incorrectCount++;
    }
  }
  
  // Calculate points using penalty-based formula
  // Score = (correct_selections / N) - (incorrect_selections / N)
  const score = (correctCount / N) - (incorrectCount / N);
  
  // Ensure minimum is 0 (no negative scores)
  return Math.max(0, score);
}

/**
 * Evaluate fill-in-the-blank questions
 * Each blank must match one of the accepted answers
 * Uses symbolic comparison for math mode questions
 */
async function evaluateFillInTheBlank(question: any, userAnswer: QuizAnswer): Promise<number> {
  if (!question.blanks || question.blanks.length === 0) {
    return 0;
  }

  const blanks = question.blanks;
  const userAnswers = userAnswer.answer; // Array of user's answers for each blank
  
  let correctBlanks = 0;
  
  // Partial scoring: Each blank has equal weight (1/n of total points)
  // Example: 3 blanks, 2 correct = 2/3 = 0.67 points
  for (const [index, blank] of blanks.entries()) {
    // Use blank.index to retrieve the answer, not the array index
    // This ensures that blank {3} maps to userAnswers[3], not userAnswers[index]
    const blankIndex = blank.index !== undefined ? blank.index : index;
    const userBlankAnswer = (userAnswers[blankIndex] || '').toString().trim();
    const correctAnswers = blank.correctAnswers || [];
    const caseSensitive = blank.caseSensitive || false;
    const tolerance = blank.tolerance !== undefined ? blank.tolerance : 0.0001;
    
    // Check math mode per blank (not per question)
    const blankMathMode = blank.mathMode === true;
    
    // Check if user's answer matches any of the correct answers
    let isMatch = false;
    
    if (blankMathMode) {
      // Check algebra mode: true = symbolic comparison, false = exact value comparison
      const algebraMode = blank.algebraMode !== false; // Default to true (algebra mode)
      
      if (algebraMode) {
        // Algebra mode: Use symbolic comparison (12*12 = 144)
        // User answer might be in LaTeX format, correct answers are in natural form
        // compareMathExpressions can handle both
        // Use Promise.all to check all correct answers
        const matchResults = await Promise.all(
          correctAnswers.map(async (correctAns: string) => {
            const correct = correctAns.trim();
            return await compareMathExpressions(userBlankAnswer, correct, tolerance);
          })
        );
        isMatch = matchResults.some(result => result === true);
      } else {
        // Value mode: Only exact numeric values match (144 only, not 12*12)
        // Convert both to numbers and compare
        isMatch = correctAnswers.some((correctAns: string) => {
          const correct = correctAns.trim();
          try {
            // Try to evaluate both as numbers
            const userNum = parseFloat(userBlankAnswer);
            const correctNum = parseFloat(correct);
            
            if (!isNaN(userNum) && !isNaN(correctNum)) {
              // Both are numeric - compare with tolerance
              return Math.abs(userNum - correctNum) <= tolerance;
            }
            
            // If not both numeric, fall back to string comparison
            return userBlankAnswer.toLowerCase() === correct.toLowerCase();
          } catch (e) {
            // Fallback to string comparison
            return userBlankAnswer.toLowerCase() === correct.toLowerCase();
          }
        });
      }
    } else {
      // Text mode - use string comparison
      isMatch = correctAnswers.some((correctAns: string) => {
        const correct = correctAns.trim();
        if (caseSensitive) {
          return userBlankAnswer === correct;
        } else {
          return userBlankAnswer.toLowerCase() === correct.toLowerCase();
        }
      });
    }
    
    if (isMatch) {
      correctBlanks++;
    }
  }
  
  // Return proportional score with equal weights per blank
  // Each blank contributes 1/n of the total points (where n = number of blanks)
  return correctBlanks / blanks.length;
}

export async function saveQuizResult(data: {
  userId: number;
  quizId: number;
  answers: QuizAnswer[];
  result: QuizResult;
  timeSpent: number;
  scoreReleasedAt?: Date | null;
  endReason?: 'manual' | 'time_up';
}) {
  return await prisma.quizAttempt.create({
    data: {
      userId: data.userId,
      quizId: data.quizId,
      answers: JSON.stringify(data.answers),
      score: data.result.score,
      totalQuestions: data.result.totalQuestions,
      correctAnswers: data.result.correctAnswers,
      percentage: data.result.percentage,
      timeSpent: data.timeSpent,
      detailedResults: JSON.stringify(data.result.detailedResults),
      scoreReleasedAt: data.scoreReleasedAt || null,
      endReason: data.endReason || 'manual'
    }
  });
}

export async function getQuizResults(userId: number, quizId: number) {
  const results = await prisma.quizAttempt.findMany({
    where: { userId, quizId },
    orderBy: { completedAt: 'desc' }
  });

  return results.map(result => ({
    ...result,
    answers: JSON.parse(result.answers),
    detailedResults: JSON.parse(result.detailedResults)
  }));
}

export async function getUserProgress(userId: number) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    include: {
      quiz: {
        include: {
          course: {
            select: { title: true, slug: true }
          }
        }
      }
    },
    orderBy: { completedAt: 'desc' }
  });

  // Filter to only released attempts for score calculations
  const releasedAttempts = attempts.filter(a => a.scoreReleasedAt !== null);

  const stats = {
    totalAttempts: attempts.length,
    averageScore: releasedAttempts.length > 0 
      ? Math.round(releasedAttempts.reduce((sum, a) => sum + a.percentage, 0) / releasedAttempts.length) 
      : 0,
    bestScore: releasedAttempts.length > 0 
      ? Math.max(...releasedAttempts.map(a => a.percentage)) 
      : 0,
    coursesCompleted: new Set(
      attempts
        .filter(a => a.quiz.course !== null)
        .map(a => a.quiz.course!.slug)
    ).size,
    recentActivity: attempts.slice(0, 5)
  };

  return { attempts, stats };
}

