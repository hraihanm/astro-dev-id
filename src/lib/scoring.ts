import { prisma } from './db';

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

export function calculateScore(questions: any[], answers: QuizAnswer[]): QuizResult {
  let correctAnswers = 0;
  let totalPoints = 0;
  let earnedPoints = 0;
  const detailedResults: QuestionResult[] = [];

  questions.forEach((question, index) => {
    const userAnswer = answers.find(a => a.questionId === index);
    const questionResult = evaluateQuestion(question, userAnswer);
    
    detailedResults.push(questionResult);
    
    if (questionResult.isCorrect) {
      correctAnswers++;
    }
    
    totalPoints += questionResult.maxPoints;
    earnedPoints += questionResult.points;
  });

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

function evaluateQuestion(question: any, userAnswer?: QuizAnswer): QuestionResult {
  const maxPoints = 1;
  let points = 0;
  let isCorrect = false;

  if (!userAnswer) {
    return {
      questionId: question.id || 0,
      question,
      userAnswer: [],
      correctAnswer: question.correctAnswer,
      isCorrect: false,
      points: 0,
      maxPoints
    };
  }

  switch (question.type) {
    case 'multiple-choice':
      isCorrect = userAnswer.answer[0] === parseInt(question.correctAnswer);
      points = isCorrect ? maxPoints : 0;
      break;
      
    case 'multiple-select':
      const userSelections = userAnswer.answer.sort();
      const correctSelections = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer.sort() 
        : [question.correctAnswer];
      isCorrect = JSON.stringify(userSelections) === JSON.stringify(correctSelections);
      points = isCorrect ? maxPoints : 0;
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
  }

  return {
    questionId: question.id || 0,
    question,
    userAnswer: userAnswer.answer,
    correctAnswer: question.correctAnswer,
    isCorrect,
    points,
    maxPoints
  };
}

export async function saveQuizResult(data: {
  userId: number;
  quizId: number;
  answers: QuizAnswer[];
  result: QuizResult;
  timeSpent: number;
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
      detailedResults: JSON.stringify(data.result.detailedResults)
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

  const stats = {
    totalAttempts: attempts.length,
    averageScore: attempts.length > 0 
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentage, 0) / attempts.length) 
      : 0,
    bestScore: attempts.length > 0 
      ? Math.max(...attempts.map(a => a.percentage)) 
      : 0,
    coursesCompleted: new Set(attempts.map(a => a.quiz.course.slug)).size,
    recentActivity: attempts.slice(0, 5)
  };

  return { attempts, stats };
}

