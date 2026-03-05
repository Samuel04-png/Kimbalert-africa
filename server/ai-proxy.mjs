import dotenv from 'dotenv';
import express from 'express';

dotenv.config();

const app = express();
const PORT = Number(process.env.AI_PROXY_PORT || 8787);
const ALLOWED_ORIGIN = process.env.APP_ORIGIN || '';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const REQUEST_TIMEOUT_MS = 12000;

const rateStore = new Map();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX = 24;

app.use(express.json({ limit: '16kb' }));

app.use((req, res, next) => {
  if (ALLOWED_ORIGIN) {
    res.header('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  }
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

function nowIso() {
  return new Date().toISOString();
}

function cleanText(value, max = 220) {
  if (!value || typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, max);
}

function validAge(value) {
  const age = Number(value);
  if (!Number.isFinite(age)) return 0;
  return Math.max(0, Math.min(18, Math.round(age)));
}

function heuristicSummary(input) {
  const parts = [
    `${input.childName}, age ${input.age}, has been reported missing.`,
    input.location ? `Last seen at ${input.location}.` : '',
    input.outfit ? `Outfit: ${input.outfit}.` : '',
    input.context ? `Context: ${input.context}.` : '',
    input.nearby ? `Nearby individuals/vehicles: ${input.nearby}.` : '',
  ];
  return parts.filter(Boolean).join(' ').trim();
}

function normalizeInput(payload) {
  return {
    childName: cleanText(payload?.childName, 80) || 'Child',
    age: validAge(payload?.age),
    location: cleanText(payload?.location, 180),
    outfit: cleanText(payload?.outfit, 120),
    context: cleanText(payload?.context, 300),
    nearby: cleanText(payload?.nearby, 220),
  };
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function isRateLimited(ip) {
  const now = Date.now();
  const record = rateStore.get(ip);
  if (!record || now > record.resetAt) {
    rateStore.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return true;
  }
  record.count += 1;
  rateStore.set(ip, record);
  return false;
}

async function callDeepSeek(input) {
  if (!DEEPSEEK_API_KEY) return null;

  const prompt = [
    'You are an emergency incident summarizer for a missing child response system.',
    'Create a concise factual summary in plain language (max 90 words).',
    'Do not add facts not provided.',
    `Child: ${input.childName}, Age: ${input.age}`,
    `Location: ${input.location || 'Not provided'}`,
    `Outfit: ${input.outfit || 'Not provided'}`,
    `Context: ${input.context || 'Not provided'}`,
    `Nearby: ${input.nearby || 'Not provided'}`,
  ].join('\n');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: DEEPSEEK_MODEL,
        temperature: 0.2,
        max_tokens: 220,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });

    if (!response.ok) return null;
    const data = await response.json();
    const summary = data?.choices?.[0]?.message?.content?.trim();
    return summary || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'kimbalert-ai-proxy',
    deepseekConfigured: Boolean(DEEPSEEK_API_KEY),
    time: nowIso(),
  });
});

app.post('/api/ai/incident-summary', async (req, res) => {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    res.status(429).json({
      ok: false,
      error: 'Rate limit exceeded',
    });
    return;
  }

  const input = normalizeInput(req.body || {});
  if (!input.childName || !input.location) {
    res.status(400).json({
      ok: false,
      error: 'childName and location are required',
    });
    return;
  }

  const fallback = heuristicSummary(input);
  const deepseek = await callDeepSeek(input);

  if (deepseek) {
    res.json({
      ok: true,
      provider: 'deepseek-proxy',
      summary: deepseek,
    });
    return;
  }

  res.json({
    ok: true,
    provider: 'heuristic',
    summary: fallback,
  });
});

app.listen(PORT, () => {
  console.log(`[${nowIso()}] AI proxy listening on http://localhost:${PORT}`);
});
