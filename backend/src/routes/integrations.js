import express from "express";
import multer from "multer";
import sharp from "sharp";
import { fileTypeFromFile } from "file-type";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { GoogleGenAI, Type } from "@google/genai";
import { requireAuth } from "../auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 8 * 1024 * 1024; // 8MB

const ALLOWED = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, _file, cb) => cb(null, `${crypto.randomBytes(16).toString("hex")}.part`),
});

const upload = multer({ storage, limits: { fileSize: MAX_BYTES, files: 1 } });

function receiveFile(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (!err) return next();
    const tooBig = err.code === "LIMIT_FILE_SIZE";
    res.status(tooBig ? 413 : 400).json({
      message: tooBig ? `File too large (max ${Math.round(MAX_BYTES / 1024 / 1024)} MB).` : "Upload failed",
    });
  });
}

const router = express.Router();

// POST /integrations/upload
router.post("/upload", requireAuth, receiveFile, async (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  const tmpPath = req.file.path;
  let finalPath;
  try {
    const detected = await fileTypeFromFile(tmpPath);
    const ext = detected && ALLOWED[detected.mime];
    if (!ext) {
      fs.rmSync(tmpPath, { force: true });
      return res.status(415).json({ message: "Unsupported file. Use JPG, PNG, WebP, PDF or DOCX." });
    }
    const id = path.basename(tmpPath, ".part");
    finalPath = path.join(UPLOAD_DIR, `${id}${ext}`);
    if (detected.mime.startsWith("image/")) {
      const optimizedBuffer = await sharp(tmpPath)
        .rotate()
        .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toBuffer();
      fs.rmSync(tmpPath, { force: true });
      const dataUrl = `data:image/jpeg;base64,${optimizedBuffer.toString("base64")}`;
      return res.json({
        file_url: dataUrl,
        file_name: req.file.originalname,
        file_size_kb: Math.max(1, Math.round(optimizedBuffer.length / 1024)),
        content_type: "image/jpeg",
      });
    } else {
      fs.renameSync(tmpPath, finalPath);
    }
    const publicBase = process.env.PUBLIC_UPLOAD_BASE || "/uploads";
    res.json({
      file_url: `${publicBase}/${id}${ext}`,
      file_name: req.file.originalname,
      file_size_kb: Math.round(fs.statSync(finalPath).size / 1024),
      content_type: detected.mime,
    });
  } catch {
    fs.rmSync(tmpPath, { force: true });
    if (finalPath) fs.rmSync(finalPath, { force: true });
    res.status(400).json({ message: "Could not process this file. Try a different one." });
  }
});

// Fallback smart router aligned with every Resources tab & helpline
function fallbackGuide(query = "") {
  const q = query.toLowerCase();

  if (q.includes("child") || q.includes("kid") || q.includes("youth") || q.includes("teen") || q.includes("bully") || q.includes("marriage") || q.includes("116")) {
    return {
      urgent: false,
      reply: "Childline Zambia (116) offers free, 24/7 confidential counseling, guidance, and referrals for children and youth dealing with abuse, bullying, child marriage, mental health, and online safety.",
      actions: [
        { label: "Call Childline Zambia (116)", description: "Toll-free 24/7 child & youth helpline", route: "tel:116" },
        { label: "Open Child Protection Tab", description: "View Childline Zambia (116) details", route: "/beka/resources?tab=child_protection" },
      ],
    };
  }

  if (q.includes("legal") || q.includes("lawyer") || q.includes("court") || q.includes("rights") || q.includes("aid") || q.includes("256454")) {
    return {
      urgent: false,
      reply: "For free or subsidized legal assistance in Zambia, contact the Legal Aid Board of Zambia at +260 211 256454, hotline +260 977 123456, or WhatsApp +260 766 881526 (Mon–Fri, 8:00 AM – 5:00 PM).",
      actions: [
        { label: "Open Legal Aid Tab", description: "Call or WhatsApp Legal Aid Board", route: "/beka/resources?tab=legal_aid" },
        { label: "Call Legal Aid (+260 211 256454)", description: "Mon–Fri 8:00 AM – 5:00 PM", route: "tel:+260211256454" },
        { label: "Statement Builder (Form 32)", description: "Prepare your official statement", route: "/beka/statement" },
      ],
    };
  }

  if (q.includes("shelter") || q.includes("safe house") || q.includes("refuge") || q.includes("accommodation") || q.includes("flee") || q.includes("nowhere to stay")) {
    return {
      urgent: true,
      reply: "Temporary shelters and safe houses in Zambia are coordinated through YWCA Zambia, Lifeline/Childline (933 / 116), and the Department of Social Welfare. Exact street addresses are kept confidential and shared after intake screening.",
      actions: [
        { label: "Open Shelters Tab", description: "Safe refuge coordination & intake", route: "/beka/resources?tab=shelter" },
        { label: "Call Lifeline (933) for Intake", description: "24/7 confidential shelter referral", route: "tel:933" },
      ],
    };
  }

  if (q.includes("counsel") || q.includes("mental") || q.includes("depress") || q.includes("suicid") || q.includes("stress") || q.includes("grief") || q.includes("trauma") || q.includes("hiv")) {
    return {
      urgent: false,
      reply: "Free confidential counseling is available 24/7 via Lifeline Zambia (933) for adults, Childline Zambia (116) for youth, and Mental Health Users Network of Zambia (+260 21 123 7191).",
      actions: [
        { label: "Open Counseling Tab", description: "Lifeline (933), Childline (116) & MHUNZ", route: "/beka/resources?tab=counseling" },
        { label: "Call Lifeline Zambia (933)", description: "Free 24/7 telephone & chat support", route: "tel:933" },
      ],
    };
  }

  if (q.includes("one-stop") || q.includes("onestop") || q.includes("one stop") || q.includes("933")) {
    return {
      urgent: false,
      reply: "Lifeline Zambia (933) provides toll-free, 24/7 counseling and support for adults regarding gender-based violence (GBV), mental health, substance abuse, and HIV/AIDS.",
      actions: [
        { label: "Open One-Stop Centers Tab", description: "Integrated adult GBV & health support", route: "/beka/resources?tab=osc" },
        { label: "Call Lifeline Zambia (933)", description: "24/7 toll-free adult support", route: "tel:933" },
      ],
    };
  }

  if (q.includes("fire") || q.includes("ambulance") || q.includes("accident") || q.includes("rtsa") || q.includes("road") || q.includes("999") || q.includes("993") || q.includes("983") || q.includes("danger") || q.includes("panic") || q.includes("emergency")) {
    return {
      urgent: true,
      reply: "For immediate emergencies: Police & Ambulance 991, General Emergency 999, Zambia Fire Brigade 993, or RTSA Road Safety 983 — or trigger BEKA's Panic SOS.",
      actions: [
        { label: "Open Emergency Response Tab", description: "Police (991), 999, Ambulance, Fire (993), RTSA (983)", route: "/beka/resources?tab=emergency_response" },
        { label: "Trigger Help & Panic SOS", description: "Send live GPS alert & notify contacts", route: "/beka/panic" },
        { label: "Call Police / Ambulance (991)", description: "24/7 toll-free dispatch", route: "tel:991" },
      ],
    };
  }

  if (q.includes("evidence") || q.includes("photo") || q.includes("screenshot") || q.includes("proof")) {
    return {
      urgent: false,
      reply: "You can securely store photos, harassment screenshots, and documents in your encrypted Evidence Vault.",
      actions: [
        { label: "Evidence Vault", description: "Upload and lock evidence safely", route: "/beka/evidence" },
        { label: "Report Incident", description: "Log what happened step by step", route: "/beka/report" },
      ],
    };
  }

  if (q.includes("police") || q.includes("form") || q.includes("statement") || q.includes("report")) {
    return {
      urgent: false,
      reply: "You can file a formal incident report, generate a Zambia Police Form 32 statement, or call Police Emergency on 991 (0211-220006).",
      actions: [
        { label: "Report an Incident", description: "Submit a new case report", route: "/beka/report" },
        { label: "Statement Builder (Form 32)", description: "Prepare your official police statement", route: "/beka/statement" },
        { label: "VSU Units Tab", description: "View Victim Support Unit desks", route: "/beka/resources?tab=vsu" },
      ],
    };
  }

  return {
    urgent: false,
    reply: "Here are BEKA's safety tools and Zambia's national helplines—tap any option below to go straight to that tab or service.",
    actions: [
      { label: "Emergency Response (991 / 999 / 993 / 983)", description: "Police, Ambulance, Fire Brigade & RTSA", route: "/beka/resources?tab=emergency_response" },
      { label: "Counseling & One-Stop (933 / 116)", description: "Lifeline, Childline & Mental Health NGO", route: "/beka/resources?tab=counseling" },
      { label: "Shelters & Child Protection", description: "Safe refuge & Childline (116)", route: "/beka/resources?tab=shelter" },
      { label: "Legal Aid Board Zambia", description: "Free/subsidized legal help (Mon–Fri 8–5)", route: "/beka/resources?tab=legal_aid" },
    ],
  };
}

const ASSISTANT_SYSTEM_INSTRUCTION = `You are BEKA AI, a compassionate, trauma-informed quick-access guide embedded inside BEKA, a Gender-Based Violence (GBV) and Technology-Facilitated GBV (TFGBV) emergency response app in Zambia.
Your job is to immediately understand what a user is asking for and connect them to the exact app page, Resources department tab, or Zambian helpline number.

Available BEKA app routes and Resources tabs (ONLY use routes from this list or direct "tel:..." links):
- "/beka/panic" -> Help & Panic SOS (Red panic button, silent mode, live GPS alert to responders & selected contacts)
- "/beka/contacts" -> Contacts to be Alerted (Choose which trusted contacts get notified)
- "/beka/report" -> Report Incident (Submit GBV/TFGBV report)
- "/beka/evidence" -> Evidence Vault (Safely store photos, screenshots, documents)
- "/beka/statement" -> Statement Builder & Zambia Police Form 32
- "/beka/messages" -> Confidential Support Chat
- "/beka/resources?tab=vsu" -> VSU Units Tab (Zambia Police Victim Support Unit)
- "/beka/resources?tab=osc" -> One-Stop Centers Tab:
  - Lifeline Zambia (933): Toll-free, 24/7 counseling and support for adults regarding gender-based violence (GBV), mental health, substance abuse, and HIV/AIDS.
- "/beka/resources?tab=shelter" -> Shelters Tab:
  - Temporary shelters and safe houses in Zambia coordinated through YWCA Zambia, Lifeline/Childline (933 / 116), and the Department of Social Welfare. Exact street addresses of domestic violence safe houses are kept confidential and shared only after intake screening.
- "/beka/resources?tab=child_protection" -> Child Protection Tab:
  - Childline Zambia (116): Toll-free, 24/7 confidential counseling, guidance, and referral services for children and youth dealing with abuse, bullying, child marriage, mental health, and online safety.
- "/beka/resources?tab=counseling" -> Counseling Tab:
  - Lifeline Zambia (933): Free telephone, WhatsApp, and online chat counselling for adults (mental health, stress, depression, suicide prevention, substance abuse, grief, GBV, HIV/AIDS).
  - Childline Zambia (116): Free 24/7 psychosocial counselling and referrals for children, teenagers, and young people.
  - Mental Health Users Network of Zambia: +260 21 123 7191 (non-profit mental health support NGO).
- "/beka/resources?tab=legal_aid" -> Legal Aid Tab:
  - Legal Aid Board of Zambia: +260 211 256454, hotline +260 977 123456, or WhatsApp +260 766 881526 (Mon–Fri, 8:00 AM – 5:00 PM) for free or subsidized legal assistance.
- "/beka/resources?tab=emergency_response" -> Emergency Response Tab:
  - Police Emergency: 991 (toll-free) or 0211-220006
  - General Emergency Assistance: 999 (toll-free) or 0211-236644 / 0211-702664
  - Ambulance Services: 991 (toll-free) or 0211-220180
  - Zambia Fire Brigade: 993 (toll-free) or 02-11220180
  - Road Transport & Safety Agency (RTSA): 983 (toll-free) or +260 955 983 983

Rules:
1. Keep "reply" warm, clear, and concise (1 to 3 sentences), quoting the exact relevant phone numbers/hours from the knowledge base above.
2. Set "urgent" to true if the user mentions immediate danger, physical threat, fire, medical emergency, suicide crisis, or needing urgent rescue/shelter.
3. Return 2 to 4 relevant "actions" pointing directly to the matching "/beka/resources?tab=..." route, app route, or "tel:..." number so they can tap straight through.`;

// POST /integrations/llm -> Google Gemini with automatic local helpline router fallback
router.post("/llm", requireAuth, async (req, res) => {
  const { mode, query, prompt } = req.body || {};
  const geminiKey = process.env.GEMINI_API_KEY;
  const hasGemini = Boolean(geminiKey && geminiKey !== "YOUR_ACTUAL_GEMINI_API_KEY");

  if (mode === "assistant") {
    const userQuery = String(query || "").trim() || "Give me a quick overview of what I can do in this app.";

    if (hasGemini) {
      try {
        const ai = new GoogleGenAI({ apiKey: geminiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: userQuery,
          config: {
            systemInstruction: ASSISTANT_SYSTEM_INSTRUCTION,
            temperature: 0.25,
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                urgent: { type: Type.BOOLEAN },
                reply: { type: Type.STRING },
                actions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      label: { type: Type.STRING },
                      description: { type: Type.STRING },
                      route: { type: Type.STRING },
                    },
                    required: ["label", "description", "route"],
                  },
                },
              },
              required: ["urgent", "reply", "actions"],
            },
          },
        });
        return res.json(JSON.parse(response.text));
      } catch (err) {
        console.warn("[LLM] Gemini unavailable, using built-in helpline router:", err.message);
      }
    }

    return res.json(fallbackGuide(userQuery));
  }

  // Risk Assessment Mode
  if (!prompt) {
    return res.json({ risk_level: "medium", ai_summary: "" });
  }

  if (hasGemini) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: String(prompt),
        config: {
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              risk_level: { type: Type.STRING },
              ai_summary: { type: Type.STRING },
            },
            required: ["risk_level", "ai_summary"],
          },
        },
      });
      return res.json(JSON.parse(response.text));
    } catch (err) {
      console.warn("[LLM] Gemini risk assessment unavailable:", err.message);
    }
  }

  return res.json({ risk_level: "medium", ai_summary: "" });
});

export default router;
export { UPLOAD_DIR };
