import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

export async function runLiteLlmJson<T>(messages: ChatCompletionMessageParam[]): Promise<T> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY가 설정되지 않았습니다.");
  }

  const openai = new OpenAI({ apiKey });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_LITE_MODEL?.trim() || "gpt-4o-mini",
    messages,
    temperature: 0.65,
    max_tokens: 2200,
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("LLM 응답이 비어 있습니다.");
  return JSON.parse(raw) as T;
}
