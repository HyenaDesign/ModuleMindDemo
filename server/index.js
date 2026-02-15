require("dotenv").config();

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const mammoth = require("mammoth");
const JSZip = require("jszip");

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

async function extractImagesFromDocx(filePath) {
  try {
    console.log("🔍 Attempting to extract images from DOCX zip structure...");
    const buffer = fs.readFileSync(filePath);
    const zip = new JSZip();
    await zip.loadAsync(buffer);
    
    const images = [];
    const mediaFolder = zip.folder("word/media");
    
    if (mediaFolder) {
      const mediaFiles = Object.keys(mediaFolder.files);
      console.log(`📁 Found media folder with ${mediaFiles.length} files`);
      
      for (const file of mediaFiles) {
        if (file !== "word/media/") { // Skip folder itself
          const data = await mediaFolder.file(file).async("base64");
          console.log(`✅ Extracted ${file}: ${data.length} bytes`);
          images.push(data);
        }
      }
    } else {
      console.log("❌ No word/media folder found in DOCX");
    }
    
    return images;
  } catch (error) {
    console.error("⚠️  Error extracting images from zip:", error);
    return [];
  }
}

async function extractTextFromFile(file) {
  const name = (file.originalname || "").toLowerCase();

  if (name.endsWith(".pdf")) {
    const buffer = fs.readFileSync(file.path);
    const pdfParse = require("pdf-parse");
    const data = await pdfParse(buffer);
    return { text: cleanAndClamp(data.text), images: [] };
  }

  if (name.endsWith(".docx")) {
    console.log("📄 Processing DOCX file:", file.originalname);
    
    let images = [];
    
    // Try mammoth's image converter
    const imageConverter = {
      convertImage: async (image) => {
        try {
          console.log(`🖼️  Converting image ${images.length}...`);
          const buffer = await image.read("base64");
          console.log(`✅ Extracted image ${images.length}: size=${buffer.length} bytes`);
          images.push(buffer);
          return { src: `image-${images.length - 1}` };
        } catch (error) {
          console.error("❌ Error extracting image:", error);
          return { src: "" };
        }
      },
    };

    console.log("🔄 Converting DOCX to HTML with Mammoth...");
    const res = await mammoth.convertToHtml(
      { path: file.path },
      { imageConverter: imageConverter }
    );
    
    if (res.warnings && res.warnings.length > 0) {
      console.log("⚠️  Mammoth warnings:", res.warnings);
    }
    
    // Fallback: Extract images directly from zip if mammoth didn't find any
    if (images.length === 0) {
      console.log("📦 Mammoth found no images, trying ZIP extraction...");
      images = await extractImagesFromDocx(file.path);
    }
    
    // Extract text from HTML
    const text = res.value
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    
    console.log(`✨ DOCX processing complete! Found ${images.length} images`);
    return { text: cleanAndClamp(text), images: images };
  }

  if (name.endsWith(".txt")) {
    const txt = fs.readFileSync(file.path, "utf-8");
    return { text: cleanAndClamp(txt), images: [] };
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

    const fileData = await extractTextFromFile(file);

    if (!fileData.text || fileData.text.length < 200) {
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
            fileData.text,
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

    console.log(`📤 Sending response: ${fileData.images.length} images, quiz with ${quiz.questions?.length || quiz.length || 0} questions`);
    
    return res.json({
      ok: true,
      filename: file.originalname,
      chars: fileData.text.length,
      images: fileData.images,
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