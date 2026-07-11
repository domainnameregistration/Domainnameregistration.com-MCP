import {
  checkDomainAvailability,
  DomainApiError,
  type DomainResult,
} from "./domain-api.js";

interface CacheEntry {
  result: DomainResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

interface SearchOptions {
  batchSize?: number;
  cacheTtlMs?: number;
  now?: () => number;
  check?: (domains: string[]) => Promise<DomainResult[]>;
}

export async function searchDomainsEfficiently(
  domains: string[],
  options: SearchOptions = {},
): Promise<DomainResult[]> {
  const uniqueDomains = [...new Set(domains)];
  const batchSize = positiveInteger(
    options.batchSize ?? process.env.UPSTREAM_BATCH_SIZE,
    250,
  );
  const cacheTtlMs = positiveInteger(
    options.cacheTtlMs ?? process.env.DOMAIN_CACHE_TTL_MS,
    60_000,
  );
  const now = options.now ?? Date.now;
  const check = options.check ?? checkDomainAvailability;
  const currentTime = now();

  pruneExpired(currentTime);

  const results = new Map<string, DomainResult>();
  const uncached: string[] = [];

  for (const domain of uniqueDomains) {
    const cached = cache.get(domain);
    if (cached && cached.expiresAt > currentTime) results.set(domain, cached.result);
    else uncached.push(domain);
  }

  for (let offset = 0; offset < uncached.length; offset += batchSize) {
    const batch = uncached.slice(offset, offset + batchSize);
    const batchResults = await check(batch);

    for (const result of batchResults) {
      const key = result.domain.trim().toLowerCase();
      const normalizedResult = { ...result, domain: key };
      results.set(key, normalizedResult);
      cache.set(key, {
        result: normalizedResult,
        expiresAt: now() + cacheTtlMs,
      });
    }
  }

  return uniqueDomains.map((domain) => {
    const result = results.get(domain);
    if (!result) {
      throw new DomainApiError(`The domain API omitted a result for ${domain}.`);
    }
    return result;
  });
}

export function clearDomainCache(): void {
  cache.clear();
}

function pruneExpired(now: number): void {
  for (const [domain, entry] of cache) {
    if (entry.expiresAt <= now) cache.delete(domain);
  }
}

function positiveInteger(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
