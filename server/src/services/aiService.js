const providerConfig = {
  openai: { key: "OPENAI_API_KEY", model: "gpt-4o-mini" },
  anthropic: { key: "ANTHROPIC_API_KEY", model: "claude-3-5-haiku-latest" },
  gemini: {
    key: "GEMINI_API_KEY",
    model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
  },
};

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI provider returned invalid JSON");
  return JSON.parse(match[0]);
}

const transientStatuses = new Set([429, 500, 502, 503, 504]);

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function callOpenAI(messages) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: providerConfig.openai.model,
      response_format: { type: "json_object" },
      messages,
      temperature: 0.7,
    }),
  });
  if (!response.ok)
    throw new Error(`OpenAI request failed with ${response.status}`);
  return extractJson((await response.json()).choices[0].message.content);
}

async function callAnthropic(messages) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: providerConfig.anthropic.model,
      max_tokens: 1200,
      system: "Return only valid JSON.",
      messages: messages.filter((message) => message.role !== "system"),
    }),
  });
  if (!response.ok)
    throw new Error(`Anthropic request failed with ${response.status}`);
  return extractJson((await response.json()).content[0].text);
}

async function callGemini(messages) {
  const request = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: messages
                .map((message) => `${message.role}: ${message.content}`)
                .join("\n"),
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    }),
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${providerConfig.gemini.model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      request,
    );
    if (response.ok) {
      const data = await response.json();
      return extractJson(data.candidates[0].content.parts[0].text);
    }
    if (!transientStatuses.has(response.status)) {
      throw new Error(`Gemini request failed with ${response.status}`);
    }
    if (attempt < 2) await wait(500 * 2 ** attempt);
  }

  return null;
}

async function askProvider(messages, provider) {
  if (!providerConfig[provider]) throw new Error("Unsupported AI provider");
  if (!process.env[providerConfig[provider].key]) return null;
  try {
    if (provider === "openai") return callOpenAI(messages);
    if (provider === "anthropic") return callAnthropic(messages);
    return callGemini(messages);
  } catch (error) {
    if (transientStatuses.has(Number(error.message.match(/\d{3}/)?.[0]))) {
      return null;
    }
    throw error;
  }
}

export async function generateQuestion(
  role,
  difficulty,
  type,
  previousQuestions,
  provider = "openai",
) {
  const prompt = `Create one ${type} interview question for a ${difficulty} ${role} candidate. Avoid these previous questions: ${previousQuestions.join(" | ") || "none"}. Return JSON with questionText and questionType, where questionType is technical or behavioral.`;
  const result = await askProvider(
    [
      {
        role: "system",
        content: "You are an expert interview designer. Return only JSON.",
      },
      { role: "user", content: prompt },
    ],
    provider,
  );
  return (
    result || {
      questionText: `Tell me about a ${role} problem you solved recently and how you measured the result.`,
      questionType: type === "behavioral" ? "behavioral" : "technical",
    }
  );
}

export async function evaluateAnswer(
  question,
  answer,
  role,
  difficulty,
  provider = "openai",
) {
  const prompt = `Evaluate this ${difficulty} ${role} interview answer. Question: ${question}. Answer: ${answer}. Return JSON with score (0-10), clarity, depth, structure, and modelAnswer.`;
  const result = await askProvider(
    [
      {
        role: "system",
        content: "You are a precise interview coach. Return only JSON.",
      },
      { role: "user", content: prompt },
    ],
    provider,
  );
  if (result)
    return {
      ...result,
      score: Math.max(0, Math.min(10, Number(result.score))),
    };
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const score = Math.min(10, Math.max(3, Math.round(4 + wordCount / 35)));
  return {
    score,
    clarity:
      "Your answer has a clear starting point; tighten the main takeaway.",
    depth:
      "Add a concrete tradeoff, metric, or technical detail to show depth.",
    structure: "Use a concise situation, action, result structure.",
    modelAnswer: `A strong ${role} answer would explain the context, your decisions, and the measurable outcome.`,
  };
}

export async function generateSessionSummary(allQAPairs, provider = "openai") {
  const prompt = `Summarize these interview answers: ${JSON.stringify(allQAPairs)}. Return JSON with averageScore, strongestArea, weakestArea, and improvementSuggestions as an array of strings.`;
  const result = await askProvider(
    [
      {
        role: "system",
        content: "You are an interview coach. Return only JSON.",
      },
      { role: "user", content: prompt },
    ],
    provider,
  );
  if (result) return result;
  const scored = allQAPairs.filter((item) => Number.isFinite(item.score));
  const averageScore =
    scored.length ?
      Math.round(
        (scored.reduce((sum, item) => sum + item.score, 0) / scored.length) *
          10,
      ) / 10
    : 0;
  return {
    averageScore,
    strongestArea: "Practical reasoning",
    weakestArea: "Answer structure",
    improvementSuggestions: [
      "Lead with the result before the details.",
      "Use one concrete example in every answer.",
      "Practice concise tradeoff explanations.",
    ],
  };
}
