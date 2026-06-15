const DEFAULT_MODEL = "gpt-4.1-mini";
const DEFAULT_HF_MODEL = "openai/gpt-oss-120b:fastest";
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

  if (!process.env.OPENAI_API_KEY && !process.env.HF_TOKEN) {
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

    const answer = await callAdvisorProvider(question, context);
    return res.status(200).json({ answer });
  } catch (error) {
    console.error("Advisor request failed:", error?.message || error);
    return res.status(502).json({
      error: "Advisor request failed",
      reason: publicFailureReason(error)
    });
  }
}

async function callAdvisorProvider(question, context) {
  const errors = [];

  if (process.env.OPENAI_API_KEY) {
    try {
      return await callOpenAI(question, context);
    } catch (error) {
      errors.push(error);
      if (!shouldTryHuggingFace(error)) {
        throw error;
      }
    }
  }

  if (process.env.HF_TOKEN) {
    try {
      return await callHuggingFace(question, context);
    } catch (error) {
      errors.push(error);
    }
  }

  throw errors[errors.length - 1] || new Error("No advisor provider is configured");
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
  const prompt = buildAdvisorPrompt(question, context);

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

async function callHuggingFace(question, context) {
  const model = String(process.env.HF_MODEL || DEFAULT_HF_MODEL).trim();
  const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.HF_TOKEN}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content: "You are a careful personal finance advisor. Use only the provided finance tracker data. Give practical, specific recommendations in simple language. Do not provide legal, tax, investing, or debt advice."
        },
        {
          role: "user",
          content: buildAdvisorPrompt(question, context)
        }
      ],
      temperature: 0.3,
      max_tokens: 750,
      stream: false
    })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Hugging Face error ${response.status}: ${details.slice(0, 500)}`);
  }

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) {
    throw new Error("No text returned from Hugging Face");
  }
  return text.trim();
}

function buildAdvisorPrompt(question, context) {
  return [
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
    return process.env.HF_TOKEN
      ? "Both AI providers failed. OpenAI has no available quota, and Hugging Face also failed."
      : "The OpenAI account is rate limited or has no available quota. Add HF_TOKEN in Vercel to use the Hugging Face fallback.";
  }
  if (message.includes("Hugging Face error 401")) {
    return "The Hugging Face token is missing, invalid, or does not have inference permission.";
  }
  if (message.includes("Hugging Face error 402") || message.includes("Hugging Face error 429")) {
    return "The Hugging Face free tier is exhausted or rate limited.";
  }
  return "The AI provider request did not complete.";
}

function shouldTryHuggingFace(error) {
  const message = String(error?.message || "");
  return message.includes("OpenAI error 429")
    || message.includes("OpenAI error 402")
    || message.includes("quota")
    || message.includes("rate");
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
