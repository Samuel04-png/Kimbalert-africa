import { httpsCallable } from 'firebase/functions';
import { auth, cloudFunctions } from '../lib/firebase';

interface IncidentDraftInput {
  childName: string;
  age: number;
  location: string;
  outfit?: string;
  context?: string;
  nearby?: string;
}

function buildHeuristicSummary(input: IncidentDraftInput) {
  const parts = [
    `${input.childName}, age ${input.age}, has been reported missing.`,
    input.location ? `Last seen at ${input.location}.` : '',
    input.outfit ? `Outfit: ${input.outfit}.` : '',
    input.context ? `Context: ${input.context}.` : '',
    input.nearby ? `Nearby individuals/vehicles: ${input.nearby}.` : '',
  ];
  return parts.filter(Boolean).join(' ').trim();
}

function promiseWithTimeout<T>(promise: Promise<T>, timeoutMs = 10000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('timeout')), timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        window.clearTimeout(timer);
        reject(error);
      });
  });
}

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  timeoutMs = 10000,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timeout);
  }
}

async function callFirebaseFunctionSummary(input: IncidentDraftInput): Promise<string | null> {
  const useFunctions =
    (import.meta.env.VITE_AI_USE_FIREBASE_FUNCTIONS ?? 'false').toLowerCase() === 'true';
  if (!useFunctions) return null;
  if (!cloudFunctions) return null;
  if (!auth?.currentUser) return null;

  const functionName = import.meta.env.VITE_AI_FIREBASE_FUNCTION_NAME ?? 'incidentSummary';

  try {
    const callable = httpsCallable<
      IncidentDraftInput,
      { ok?: boolean; summary?: string; provider?: string }
    >(cloudFunctions, functionName);
    const response = await promiseWithTimeout(callable(input), 9000);
    const summary = response.data?.summary?.trim();
    return summary || null;
  } catch {
    return null;
  }
}

async function callProxySummary(input: IncidentDraftInput): Promise<string | null> {
  const proxyUrl = import.meta.env.VITE_AI_PROXY_URL;
  if (!proxyUrl) return null;

  const response = await fetchWithTimeout(
    proxyUrl,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    },
  );

  if (!response.ok) return null;
  const data = (await response.json()) as {
    ok?: boolean;
    summary?: string;
  };
  if (!data?.ok) return null;
  return data.summary?.trim() || null;
}

async function callDeepSeekSummary(input: IncidentDraftInput): Promise<string | null> {
  const allowClientProvider =
    (import.meta.env.VITE_AI_ALLOW_CLIENT_DEEPSEEK ?? 'false').toLowerCase() === 'true';
  if (!allowClientProvider) return null;

  const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
  if (!apiKey) return null;

  const baseUrl = import.meta.env.VITE_DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com';
  const model = import.meta.env.VITE_DEEPSEEK_MODEL ?? 'deepseek-chat';

  const prompt = [
    'You are an emergency incident summarizer for a missing child response system.',
    'Create a concise, factual summary in plain language (max 90 words).',
    'Do not add facts not provided.',
    `Child: ${input.childName}, Age: ${input.age}`,
    `Location: ${input.location}`,
    `Outfit: ${input.outfit || 'Not provided'}`,
    `Context: ${input.context || 'Not provided'}`,
    `Nearby: ${input.nearby || 'Not provided'}`,
  ].join('\n');

  const response = await fetchWithTimeout(
    `${baseUrl}/chat/completions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    },
  );

  if (!response.ok) return null;
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content?.trim();
  return content || null;
}

export async function generateIncidentSummary(input: IncidentDraftInput) {
  // Spark-safe fallback: heuristic summary remains available even without server-side AI.
  const heuristic = buildHeuristicSummary(input);

  try {
    const aiEnabled = (import.meta.env.VITE_AI_INSIGHTS_ENABLED ?? 'true').toLowerCase() === 'true';
    if (!aiEnabled) return heuristic;

    const proxy = await callProxySummary(input);
    if (proxy) return proxy;

    const callable = await callFirebaseFunctionSummary(input);
    if (callable) return callable;

    const remote = await callDeepSeekSummary(input);
    return remote || heuristic;
  } catch {
    return heuristic;
  }
}
