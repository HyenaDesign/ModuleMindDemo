export type PreviewQuestion = {
  id: string;
  type: "multiple_choice" | "open";
  question: string;
  options?: string[];
  answer?: string;
  explanation?: string;
};

const STORAGE_KEY = "modulemind:lastQuizResult";

export function saveQuizResult(result: unknown) {
  const serialized = JSON.stringify(result);

  if (typeof window !== "undefined") {
    window.sessionStorage?.setItem(STORAGE_KEY, serialized);
    window.localStorage?.setItem(STORAGE_KEY, serialized);
  }

  return serialized;
}

export function loadQuizResult(fallbackJson?: string | null) {
  const candidates = [
    fallbackJson,
    typeof window !== "undefined"
      ? window.sessionStorage?.getItem(STORAGE_KEY)
      : null,
    typeof window !== "undefined" ? window.localStorage?.getItem(STORAGE_KEY) : null,
  ];

  for (const raw of candidates) {
    if (!raw) continue;

    try {
      return JSON.parse(raw);
    } catch {
      continue;
    }
  }

  return null;
}

function unwrapJsonString(value: unknown) {
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

export function normalizeQuizQuestions(result: unknown): PreviewQuestion[] {
  const parsed = unwrapJsonString(result) as any;
  const quiz = unwrapJsonString(parsed?.quiz);
  let quizData: any[] | null = null;

  if (Array.isArray(parsed)) {
    quizData = parsed;
  } else if (Array.isArray(parsed?.questions)) {
    quizData = parsed.questions;
  } else if (Array.isArray(quiz)) {
    quizData = quiz;
  } else if (Array.isArray((quiz as any)?.questions)) {
    quizData = (quiz as any).questions;
  } else if (Array.isArray(parsed?.items)) {
    quizData = parsed.items;
  }

  if (!quizData?.length) return [];

  return quizData
    .map((q, idx) => {
      const choices = q.choices || q.options || q.answers || [];
      const answerIndex =
        typeof q.answerIndex === "number" ? q.answerIndex : undefined;
      const answer =
        answerIndex !== undefined
          ? choices[answerIndex] || ""
          : q.answer || q.correct_answer || q.correctAnswer || "";

      const type: PreviewQuestion["type"] = choices.length
        ? "multiple_choice"
        : "open";

      return {
        id: String(q.id || `q${idx + 1}`),
        type,
        question: String(q.question || q.text || q.prompt || "").trim(),
        options: choices.map((choice: unknown) => String(choice)),
        answer: String(answer || ""),
        explanation: String(q.explanation || q.explanations || q.reason || ""),
      };
    })
    .filter((q) => q.question);
}
