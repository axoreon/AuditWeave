export const AUDIT_REQUEST_TIMEOUT_MS = 90_000;
export const PENDING_AUDIT_PROGRESS_CEILING = 90;

export class RequestTimeoutError extends Error {
  constructor() {
    super("Request timed out");
    this.name = "RequestTimeoutError";
  }
}

export function getNextPendingAuditStep(currentStep: number, totalSteps: number): number {
  return Math.min(currentStep + 1, Math.max(0, totalSteps - 2));
}

export function getAuditProgressPercent(
  currentStep: number,
  totalSteps: number,
  complete: boolean,
): number {
  if (complete) return 100;
  if (totalSteps <= 0) return 0;
  const simulated = Math.round(((currentStep + 1) / totalSteps) * 100);
  return Math.min(PENDING_AUDIT_PROGRESS_CEILING, simulated);
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit,
  timeoutMs: number,
  fetchImplementation: typeof fetch = fetch,
): Promise<Response> {
  const controller = new AbortController();
  let timedOut = false;
  const forwardAbort = () => controller.abort();
  if (init.signal?.aborted) {
    controller.abort();
  }
  init.signal?.addEventListener("abort", forwardAbort, { once: true });
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetchImplementation(input, { ...init, signal: controller.signal });
  } catch (error: unknown) {
    if (timedOut) throw new RequestTimeoutError();
    throw error;
  } finally {
    clearTimeout(timeoutId);
    init.signal?.removeEventListener("abort", forwardAbort);
  }
}
