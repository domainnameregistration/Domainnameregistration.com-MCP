export const STATUS_LABELS = {
  0: "available",
  1: "taken",
  2: "no_info",
  3: "aftermarket",
} as const;

export type StatusCode = keyof typeof STATUS_LABELS;

export interface DomainResult {
  domain: string;
  status: StatusCode;
  statusLabel: (typeof STATUS_LABELS)[StatusCode];
}

export interface DomainApiResponse {
  domains: string[];
  statuses: number[];
}

const DEFAULT_API_URL =
  "https://domainnameregistration.com/availability/bulk-check";
const RETRYABLE_STATUSES = new Set([408, 425, 500, 502, 503, 504]);
const MAX_RETRY_AFTER_MS = 5_000;

export class DomainApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "DomainApiError";
  }
}

export function normalizeDomains(domains: string[]): string[] {
  return domains.map((domain) => domain.trim().toLowerCase());
}

function parseApiResponse(value: unknown): DomainApiResponse {
  if (!value || typeof value !== "object") {
    throw new DomainApiError("The domain API returned an invalid JSON payload.");
  }

  const body = value as Record<string, unknown>;
  const domains = body.domains;
  // Accept either common spelling while preserving the documented aligned arrays.
  const statuses = body.statuses ?? body.status;

  if (
    !Array.isArray(domains) ||
    !domains.every((domain) => typeof domain === "string") ||
    !Array.isArray(statuses) ||
    !statuses.every((status) => Number.isInteger(status))
  ) {
    throw new DomainApiError(
      "The domain API response must contain aligned domains and status arrays.",
    );
  }

  if (domains.length !== statuses.length) {
    throw new DomainApiError(
      "The domain API returned domain and status arrays of different lengths.",
    );
  }

  return { domains, statuses: statuses as number[] };
}

export async function checkDomainAvailability(
  domains: string[],
  options: {
    apiUrl?: string;
    timeoutMs?: number;
    fetchImpl?: typeof fetch;
    maxRetries?: number;
    retryBaseDelayMs?: number;
    sleepImpl?: (milliseconds: number) => Promise<void>;
  } = {},
): Promise<DomainResult[]> {
  const apiUrl = options.apiUrl ?? DEFAULT_API_URL;
  const timeoutMs =
    options.timeoutMs ?? Number(process.env.REQUEST_TIMEOUT_MS ?? 15_000);
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxRetries = options.maxRetries ?? 2;
  const retryBaseDelayMs = options.retryBaseDelayMs ?? 250;
  const sleepImpl =
    options.sleepImpl ??
    ((milliseconds: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, milliseconds)));

  let response: Response | undefined;
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      response = await fetchImpl(apiUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "user-agent": "domain-availability-mcp/0.1.0",
        },
        body: JSON.stringify({ domains }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      if (attempt < maxRetries) {
        await sleepImpl(backoffDelay(retryBaseDelayMs, attempt));
        continue;
      }

      const reason = error instanceof Error ? error.message : String(error);
      throw new DomainApiError(`Could not reach the domain API: ${reason}`);
    }

    if (response.ok || attempt >= maxRetries) break;

    const retryAfterMs = parseRetryAfter(response.headers.get("retry-after"));
    const canRetry =
      RETRYABLE_STATUSES.has(response.status) ||
      (response.status === 429 && retryAfterMs !== undefined);

    if (!canRetry || (retryAfterMs !== undefined && retryAfterMs > MAX_RETRY_AFTER_MS)) {
      break;
    }

    await response.body?.cancel();
    await sleepImpl(
      retryAfterMs ?? backoffDelay(retryBaseDelayMs, attempt),
    );
  }

  if (!response) {
    throw new DomainApiError("The domain API did not return a response.");
  }

  if (!response.ok) {
    const details = (await response.text()).trim().slice(0, 500);
    throw new DomainApiError(
      `Domain API request failed with HTTP ${response.status}${details ? `: ${details}` : "."}`,
      response.status,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new DomainApiError("The domain API returned non-JSON content.");
  }

  const parsed = parseApiResponse(payload);
  return parsed.domains.map((domain, index) => {
    const status = parsed.statuses[index];
    if (!(status in STATUS_LABELS)) {
      throw new DomainApiError(`The domain API returned unknown status ${status}.`);
    }
    const code = status as StatusCode;
    return { domain, status: code, statusLabel: STATUS_LABELS[code] };
  });
}

function backoffDelay(baseDelayMs: number, attempt: number): number {
  const exponential = baseDelayMs * 2 ** attempt;
  const jitter = 0.75 + Math.random() * 0.5;
  return Math.round(exponential * jitter);
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1_000;

  const date = Date.parse(value);
  if (Number.isNaN(date)) return undefined;
  return Math.max(0, date - Date.now());
}
