const DEFAULT_MODEL = "gpt-4.1-mini";
const MAX_BODY_BYTES = 120000;
const MODEL_ALIASES = {
  "gpt-5.4-mini": "gpt-4.1-mini",
  "gpt-5.4-nano": "gpt-4.1-mini"
};

export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    return res.status(503).json({ error: "Advisor service is not configured" });
  }

  try {
    const raw = JSON.stringify(req.body || {});
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
      return res.status(413).json({ error: "Request is too large" });
    }

    const question = String(req.body?.question || "").trim();
    const context = req.body?.context;

    if (!question || !context) {
      return res.status(400).json({ error: "Question and context are required" });
    }

    const answer = await callOpenAI(question, context);
    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Advisor request failed:", error?.message || error);
    return res.status(502).json({
      error: "Advisor request failed",
      reason: publicFailureReason(error)
    });
  }
}

function setCorsHeaders(req, res) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN || "https://turgudvaliyev2002.github.io";
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", origin === allowedOrigin ? origin : allowedOrigin);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function callOpenAI(question, context) {
  const model = resolveModel(process.env.OPENAI_MODEL);
  const prompt = [
    "You are a careful personal finance advisor.",
    "Use only the user's provided finance tracker data.",
    "Give practical and specific recommendations in simple language.",
    "Mention concrete categories, months, dates, descriptions, and amounts when useful.",
    "Do not claim certainty beyond the data.",
    "Do not provide legal, tax, investing, or debt advice.",
    "If data is limited, say that clearly.",
    "",
    `User question: ${question}`,
    "",
    `Finance data JSON:\n${JSON.stringify(context, null, 2)}`
  ].join("\n");

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: 0.3,
      max_output_tokens: 750
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`OpenAI error ${response.status}: ${details.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = extractResponseText(data);
  if (!text) {
    throw new Error("No text returned");
  }
  return text.trim();
}

function resolveModel(configuredModel) {
  const model = String(configuredModel || DEFAULT_MODEL).trim();
  return MODEL_ALIASES[model] || model || DEFAULT_MODEL;
}

function publicFailureReason(error) {
  const message = String(error?.message || "");
  if (message.includes("model") || message.includes("OpenAI error 400")) {
    return "The configured AI model is unavailable or invalid.";
  }
  if (message.includes("OpenAI error 401")) {
    return "The OpenAI API key is missing or invalid.";
  }
  if (message.includes("OpenAI error 429")) {
    return "The OpenAI account is rate limited or has no available quota.";
  }
  return "The AI provider request did not complete.";
}

function extractResponseText(data) {
  if (typeof data.output_text === "string") return data.output_text;
  const output = Array.isArray(data.output) ? data.output : [];
  return output
    .flatMap((item) => Array.isArray(item.content) ? item.content : [])
    .map((part) => part.text || "")
    .filter(Boolean)
    .join("\n");
}
