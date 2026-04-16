export interface MockQuestion {
  id: string;
  type: "open" | "mcq" | "true_false";
  text: string;
  bloomLevel: string;
  difficulty: number;
  options?: string[];
  correctIndex?: number;
  correctAnswer?: boolean;
  keywords?: string[];
}

export interface QuestionResult {
  questionId: string;
  answer: string;
  score: number;
  correct: boolean;
  bloomLevel: string;
  difficulty: number;
  feedback: string;
}

export interface GradingResult {
  score: number;
  theta: number;
  passed: boolean;
  bloomLevelsReached: string[];
  questionResults: QuestionResult[];
  confidenceInterval: [number, number];
}

function keywordScore(answer: string, keywords: string[] = []): number {
  if (keywords.length === 0) return 50;
  const lower = answer.toLowerCase();
  const hits = keywords.filter(k => lower.includes(k.toLowerCase())).length;
  return Math.min(100, Math.round((hits / keywords.length) * 80 + (answer.length > 80 ? 20 : answer.length / 4)));
}

export function gradeAnswer(question: MockQuestion, answer: string): QuestionResult {
  let score = 0;
  let correct = false;
  let feedback = "";

  if (question.type === "mcq") {
    const selected = parseInt(answer, 10);
    correct = selected === question.correctIndex;
    score = correct ? 100 : 10;
    feedback = correct
      ? "Correct! You identified the right answer."
      : `Incorrect. The best answer was option ${(question.correctIndex ?? 0) + 1}.`;
  } else if (question.type === "true_false") {
    const normalized = answer.toLowerCase().trim();
    const userBool = normalized === "true" || normalized === "t" || normalized === "yes" || normalized === "1";
    correct = userBool === (question.correctAnswer ?? true);
    score = correct ? 100 : 10;
    feedback = correct ? "Correct!" : `Incorrect. The statement is ${question.correctAnswer ? "true" : "false"}.`;
  } else {
    // open-ended
    if (answer.trim().length < 10) {
      score = 5;
      feedback = "Answer too short — try to elaborate on the concept.";
    } else {
      score = keywordScore(answer, question.keywords);
      correct = score >= 60;
      if (score >= 80) feedback = "Excellent answer with good coverage of key concepts.";
      else if (score >= 60) feedback = "Good answer — consider including more specific details.";
      else if (score >= 40) feedback = "Partial answer — some key aspects were missing.";
      else feedback = "Answer needs more depth. Try to address the core concepts directly.";
    }
    correct = score >= 60;
  }

  return {
    questionId: question.id,
    answer,
    score,
    correct,
    bloomLevel: question.bloomLevel,
    difficulty: question.difficulty,
    feedback,
  };
}

export function computeGradingResult(results: QuestionResult[]): GradingResult {
  if (results.length === 0) {
    return { score: 0, theta: -4, passed: false, bloomLevelsReached: [], questionResults: [], confidenceInterval: [0, 0] };
  }

  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  // theta: inverse of linear mapping ((theta+4)/8)*100 = score → theta = (score/100)*8 - 4
  const theta = (avgScore / 100) * 8 - 4;
  const score = Math.round(avgScore);
  const se = 0.4; // mock SE
  const ciLow = Math.max(0, Math.round(((theta - 1.96 * se + 4) / 8) * 100));
  const ciHigh = Math.min(100, Math.round(((theta + 1.96 * se + 4) / 8) * 100));

  const bloomLevelsReached = [...new Set(results.filter(r => r.correct).map(r => r.bloomLevel))];

  return {
    score,
    theta,
    passed: score >= 70,
    bloomLevelsReached,
    questionResults: results,
    confidenceInterval: [ciLow, ciHigh],
  };
}
