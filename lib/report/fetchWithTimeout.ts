export class FetchTimeoutError extends Error {
  constructor(label: string, timeoutMs: number) {
    super(`${label} timeout after ${timeoutMs}ms`);
    this.name = "FetchTimeoutError";
  }
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number; label?: string } = {},
): Promise<Response> {
  const { timeoutMs = 30_000, label = "fetch", ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new FetchTimeoutError(label, timeoutMs);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
