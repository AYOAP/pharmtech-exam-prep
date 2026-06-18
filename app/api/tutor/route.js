import { NextResponse } from "next/server";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

function extractText(payload) {
  if (payload.output_text) {
    return payload.output_text;
  }

  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .filter((part) => part.type === "output_text")
    .map((part) => part.text)
    .join("\n")
    .trim();
}

function buildPrompt({ mode, prompt, question }) {
  const modeInstruction =
    mode === "memory"
      ? "Give a short, sticky memory trick or mnemonic."
      : mode === "simplify"
        ? "Explain the concept in plain language for a stressed learner who needs clarity fast."
        : "Explain the question clearly and teach the tested concept.";

  const questionBlock = question
    ? [
        `Question: ${question.prompt}`,
        `Choices: ${question.choices.map((choice, index) => `${String.fromCharCode(65 + index)}. ${choice}`).join(" | ")}`,
        `Correct answer: ${question.choices[question.answerIndex]}`,
        `Study explanation: ${question.explanation}`,
      ].join("\n")
    : "No current question context was supplied.";

  return [
    modeInstruction,
    "Keep the response under 180 words.",
    "Make it medically accurate and PTCE relevant.",
    "If the user prompt is empty, use the question context as the main teaching target.",
    "",
    questionBlock,
    "",
    `User request: ${prompt || "Use the provided question context."}`,
  ].join("\n");
}

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "OPENAI_API_KEY is not configured yet. Add it in your local .env.local or Vercel project settings to enable the tutor.",
        },
        { status: 503 },
      );
    }

    const body = await request.json();
    const userPrompt = buildPrompt(body);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        reasoning: { effort: "low" },
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You are a warm, concise PTCE tutor. Explain concepts clearly, avoid guessing, and stay focused on PTCB-relevant pharmacy technician knowledge.",
              },
            ],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: userPrompt }],
          },
        ],
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      return NextResponse.json(
        { error: payload.error?.message || "OpenAI request failed." },
        { status: response.status },
      );
    }

    const output = extractText(payload);
    return NextResponse.json({ output, model: DEFAULT_MODEL });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Tutor request failed." }, { status: 500 });
  }
}
