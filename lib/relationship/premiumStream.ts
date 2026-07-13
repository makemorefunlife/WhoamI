export const ROMANTIC_PREMIUM_STREAM_CONTENT_TYPE =
  "application/x-ndjson; charset=utf-8" as const;

export type RomanticPremiumStreamPrelude = {
  type: "prelude";
  relationship_name: string;
  one_line_summary: string;
  grade: string;
  snapshot_panel: unknown;
};

export type RomanticPremiumStreamDelta = {
  type: "delta";
  content: string;
};

export type RomanticPremiumStreamComplete = {
  type: "complete";
  relationship_kind: "romantic";
  result_premium: unknown;
};

export type RomanticPremiumStreamError = {
  type: "error";
  message: string;
};

export type RomanticPremiumStreamEvent =
  | RomanticPremiumStreamPrelude
  | RomanticPremiumStreamDelta
  | RomanticPremiumStreamComplete
  | RomanticPremiumStreamError;

export function encodePremiumStreamLine(event: RomanticPremiumStreamEvent): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(event)}\n`);
}

export function isRomanticPremiumStreamResponse(contentType: string | null): boolean {
  return (
    contentType?.includes("application/x-ndjson") === true ||
    contentType?.includes("ndjson") === true
  );
}

export async function consumeRomanticPremiumStream(
  body: ReadableStream<Uint8Array>,
  handlers: {
    onPrelude?: (event: RomanticPremiumStreamPrelude) => void;
    onDelta?: (content: string) => void;
    onComplete?: (event: RomanticPremiumStreamComplete) => void;
    onError?: (message: string) => void;
  },
): Promise<RomanticPremiumStreamComplete | null> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let complete: RomanticPremiumStreamComplete | null = null;

  const flushLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    let parsed: RomanticPremiumStreamEvent;
    try {
      parsed = JSON.parse(trimmed) as RomanticPremiumStreamEvent;
    } catch {
      return;
    }
    if (parsed.type === "prelude") {
      handlers.onPrelude?.(parsed);
      return;
    }
    if (parsed.type === "delta") {
      handlers.onDelta?.(parsed.content);
      return;
    }
    if (parsed.type === "complete") {
      complete = parsed;
      handlers.onComplete?.(parsed);
      return;
    }
    if (parsed.type === "error") {
      handlers.onError?.(parsed.message);
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) flushLine(line);
  }
  if (buffer.trim()) flushLine(buffer);
  return complete;
}
