require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const OpenAI = require("openai");

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25MB

function cleanAndClamp(text, maxChars = 120_000) {
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
    const data = await pdfParse(fs.readFileSync(file.path));
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

    if (!text || text.length < 200) {
      return res.status(422).json({
        ok: false,
        error:
          "Not enough readable text. If this is a scanned PDF, OCR is needed.",
      });
    }

    // Ask the model for STRICT JSON
    const response = await openai.responses.create({
      model: "gpt-5.2",
      input: [
        {
          role: "system",
          content:
            "You generate study quizzes. You MUST return valid JSON only. No prose.",
        },
        {
          role: "user",
          content:
            "Create a multiple-choice quiz from the content below.\n" +
            "Rules:\n" +
            "- Return ONLY valid JSON\n" +
            "- 5–10 questions\n" +
            "- Each question has: question, choices (3–5), answerIndex, explanation\n\n" +
            "CONTENT:\n" +
            text,
        },
      ],
    });

    const raw = response.output_text;

    let quiz;
    try {
      quiz = JSON.parse(raw);
    } catch {
      throw new Error("Model did not return valid JSON");
    }

    return res.json({
      ok: true,
      filename: file.originalname,
      chars: text.length,
      quiz,
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

app.listen(4000, () => {
  console.log("✅ Server running on http://localhost:4000");
});