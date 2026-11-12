const LIMIT = 4000;
const MODEL = "gpt-5.6-terra";
const KEY = "openaiApiKey";
const FIELDS = {
  context: "general context for a knowledge base",
  speech: "speech description",
  music: "sound and music description",
  sfx: "sound-effects description",
};

let optimizing = false;

function lockStorage() {
  return Promise.all([
    chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
    chrome.storage.session.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" }),
  ]);
}

lockStorage();

function fromStudio(sender) {
  const url = sender?.url || "";
  return sender?.id === chrome.runtime.id && url.startsWith("https://mirelo.ai/studio");
}

function systemPrompt(field) {
  return [
    "You improve prompts for the Mirelo Studio assistant, which generates speech, music, and sound effects.",
    `The user is editing the ${FIELDS[field]}.`,
    "Rewrite their text into one concrete prompt. Describe the sound clearly: source, material, space, and intensity. Name the scene and one mood.",
    "Keep the positive prompt (what to hear) separate from a negative prompt. Add a negative prompt only when it makes sense: a short comma-separated list of sounds to leave out.",
    "Remove repetition and conflicting directions.",
    "Keep any instruction to use a knowledge base.",
    "Do not add visuals, camera notes, or a shot list.",
    'Return JSON with "improvements" (a short explanation of what you changed) and "prompt" (the rewritten prompt only).',
  ].join(" ");
}

function messageText(message) {
  const content = message?.content;
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content.map((part) => (typeof part?.text === "string" ? part.text : "")).join("");
}

function cleanText(value) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, 8000);
}

async function readKey() {
  const session = await chrome.storage.session.get(KEY);
  if (typeof session[KEY] === "string" && session[KEY]) return session[KEY];
  const local = await chrome.storage.local.get(KEY);
  if (typeof local[KEY] === "string" && local[KEY]) return local[KEY];
  return "";
}

async function callOpenAI(key, text, field) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(45000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      reasoning_effort: "none",
      store: false,
      max_completion_tokens: 800,
      messages: [
        { role: "system", content: systemPrompt(field) },
        { role: "user", content: text },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "optimized_prompt",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              improvements: { type: "string" },
              prompt: { type: "string" },
            },
            required: ["improvements", "prompt"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    await response.body?.cancel();
    const error = new Error("openai");
    error.code = response.status === 401 || response.status === 403 ? "auth" : response.status === 429 ? "rate" : "failed";
    throw error;
  }

  const data = await response.json();
  let parsed;
  try {
    parsed = JSON.parse(messageText(data.choices?.[0]?.message));
  } catch {
    const error = new Error("openai");
    error.code = "failed";
    throw error;
  }
  const improvements = cleanText(parsed?.improvements);
  const prompt = cleanText(parsed?.prompt);
  if (!improvements || !prompt) {
    const error = new Error("openai");
    error.code = "failed";
    throw error;
  }
  return { improvements, prompt };
}

async function optimize(message) {
  if (optimizing) return { ok: false, error: "busy" };
  const text = typeof message.text === "string" ? message.text.trim() : "";
  const field = message.field;
  if (!Object.hasOwn(FIELDS, field)) return { ok: false, error: "failed" };
  if (!text) return { ok: false, error: "empty" };
  if (text.length > LIMIT) return { ok: false, error: "too-long" };

  await lockStorage();
  const key = await readKey();
  if (!key) return { ok: false, error: "missing-key" };

  optimizing = true;
  try {
    const result = await callOpenAI(key, text, field);
    return { ok: true, improvements: result.improvements, prompt: result.prompt };
  } catch (error) {
    const code = error?.code;
    if (code === "auth" || code === "rate") return { ok: false, error: code };
    return { ok: false, error: "failed" };
  } finally {
    optimizing = false;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "optimize" || !fromStudio(sender)) return;
  optimize(message).then(sendResponse, () => sendResponse({ ok: false, error: "failed" }));
  return true;
});
