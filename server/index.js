const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const mammoth = require("mammoth");
const OpenAI = require("openai");

const app = express();
app.use(cors());

const upload = multer({ dest: path.join(__dirname, "uploads") });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const MIN_TEXT_CHARS = 200;
const MAX_TEXT_CHARS = 120_000;
const DEFAULT_MODEL = "gpt-5.1";
const SUPPORTED_MODELS = new Set(["gpt-5.1", "gpt-5.2"]);
const PORT = Number(process.env.PORT || 4000);

const quizResponseFormat = {
  type: "json_schema",
  json_schema: {
    name: "modulemind_quiz",
    strict: true,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["questions"],
      properties: {
        questions: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            required: ["question", "choices", "answerIndex", "explanation"],
            properties: {
              question: { type: "string" },
              choices: {
                type: "array",
                items: { type: "string" },
              },
              answerIndex: { type: "integer" },
              explanation: { type: "string" },
            },
          },
        },
      },
    },
  },
};

const jsonObjectResponseFormat = { type: "json_object" };

function cleanAndClamp(text, maxChars = MAX_TEXT_CHARS) {
  const cleaned = (text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned.length > maxChars ? cleaned.slice(0, maxChars) : cleaned;
}

async function extractTextFromFile(file) {
  const name = (file.originalname || "").toLowerCase();

  if (name.endsWith(".pdf")) {
    const buffer = fs.readFileSync(file.path);
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return cleanAndClamp(data.text);
  }

  if (name.endsWith(".docx")) {
    const res = await mammoth.extractRawText({ path: file.path });
    return cleanAndClamp(res.value);
  }

  if (name.endsWith(".txt")) {
    const txt = fs.readFileSync(file.path, "utf-8");
    return cleanAndClamp(txt);
  }

  throw new Error("Unsupported file type. Use PDF, DOCX, or TXT.");
}

function parseJsonLoose(value) {
  if (!value) return null;
  if (typeof value === "object") return value;

  const raw = String(value).trim();
  const withoutFence = raw
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  for (const candidate of [
    withoutFence,
    withoutFence.slice(withoutFence.indexOf("{"), withoutFence.lastIndexOf("}") + 1),
    withoutFence.slice(withoutFence.indexOf("["), withoutFence.lastIndexOf("]") + 1),
  ]) {
    if (!candidate) continue;
    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  return null;
}

function normalizeQuiz(value) {
  const parsed = parseJsonLoose(value);
  const quiz = parseJsonLoose(parsed?.quiz) || parsed?.quiz;
  let rows = null;

  if (Array.isArray(parsed)) rows = parsed;
  else if (Array.isArray(parsed?.questions)) rows = parsed.questions;
  else if (Array.isArray(quiz)) rows = quiz;
  else if (Array.isArray(quiz?.questions)) rows = quiz.questions;
  else if (Array.isArray(parsed?.items)) rows = parsed.items;

  if (!Array.isArray(rows)) return null;

  const questions = rows
    .map((item) => {
      const choices = (item.choices || item.options || item.answers || [])
        .map((choice) => String(choice).trim())
        .filter(Boolean);
      const question = String(item.question || item.text || item.prompt || "").trim();
      const explanation = String(item.explanation || item.reason || "").trim();

      let answerIndex =
        typeof item.answerIndex === "number"
          ? item.answerIndex
          : typeof item.correctIndex === "number"
            ? item.correctIndex
            : -1;

      const answerText = String(
        item.answer || item.correct_answer || item.correctAnswer || ""
      ).trim();

      if (answerIndex < 0 && answerText) {
        answerIndex = choices.findIndex((choice) => choice === answerText);
      }

      if (answerIndex < 0 || answerIndex >= choices.length) {
        answerIndex = 0;
      }

      return {
        question,
        choices,
        answerIndex,
        explanation,
      };
    })
    .filter(
      (item) =>
        item.question &&
        item.choices.length >= 3 &&
        item.choices.length <= 5 &&
        item.explanation
    )
    .slice(0, 10);

  return questions.length ? { questions } : null;
}

async function requestQuizCompletion(text, model, responseFormat) {
  return openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You create study quizzes from provided learning material. Output JSON only. The JSON must have a top-level questions array.",
      },
      {
        role: "user",
        content:
          "Create 5 to 10 multiple-choice questions from this content. " +
          "Each question must have 3 to 5 choices, a zero-based answerIndex, and a short explanation. " +
          "Use only facts supported by the content.\n\nCONTENT:\n" +
          text,
      },
    ],
    response_format: responseFormat,
  });
}

async function createQuiz(text, model) {
  const attempts = [
    { name: "structured JSON schema", format: quizResponseFormat },
    { name: "JSON mode", format: jsonObjectResponseFormat },
  ];

  const errors = [];

  for (const attempt of attempts) {
    try {
      const completion = await requestQuizCompletion(text, model, attempt.format);
      const message = completion.choices?.[0]?.message;

      if (message?.refusal) {
        throw new Error(`The model refused to generate a quiz: ${message.refusal}`);
      }

      const raw = message?.content || "";
      const quiz = normalizeQuiz(raw);

      if (quiz) return quiz;

      const finishReason = completion.choices?.[0]?.finish_reason;
      errors.push(
        finishReason === "length"
          ? `${attempt.name}: response was cut off`
          : `${attempt.name}: response did not contain valid quiz questions`
      );
    } catch (err) {
      errors.push(`${attempt.name}: ${err.message || "request failed"}`);
    }
  }

  throw new Error(
    "Could not generate valid quiz JSON. " + errors.filter(Boolean).join("; ")
  );
}

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ ok: false, error: "No file uploaded" });
    }

    if (file.size && file.size > MAX_FILE_BYTES) {
      return res
        .status(413)
        .json({ ok: false, error: "File too large (max 25MB)" });
    }

    const text = await extractTextFromFile(file);

    if (!text || text.length < MIN_TEXT_CHARS) {
      return res.status(422).json({
        ok: false,
        error:
          "Not enough readable text. If this is a scanned PDF, OCR is needed.",
      });
    }

    const selectedModel = (req.body.model || DEFAULT_MODEL).toString();
    const model = SUPPORTED_MODELS.has(selectedModel)
      ? selectedModel
      : DEFAULT_MODEL;
    const quiz = await createQuiz(text, model);

    return res.json({
      ok: true,
      filename: file.originalname,
      chars: text.length,
      quiz,
      questions: quiz.questions,
    });
  } catch (err) {
    return res.status(400).json({
      ok: false,
      error: err.message || "Processing failed",
    });
  } finally {
    if (req.file?.path) fs.unlink(req.file.path, () => {});
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
