import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DomainResult } from "./domain-api.js";
import {
  clearDomainCache,
  searchDomainsEfficiently,
} from "./domain-service.js";

function taken(domain: string): DomainResult {
  return { domain, status: 1, statusLabel: "taken" };
}

describe("efficient domain search", () => {
  beforeEach(() => clearDomainCache());

  it("deduplicates and checks uncached domains in sequential batches", async () => {
    const check = vi.fn(async (domains: string[]) => domains.map(taken));

    const results = await searchDomainsEfficiently(
      ["a.com", "a.com", "b.com", "c.com"],
      { batchSize: 2, cacheTtlMs: 1_000, now: () => 0, check },
    );

    expect(results.map((result) => result.domain)).toEqual([
      "a.com",
      "b.com",
      "c.com",
    ]);
    expect(check.mock.calls).toEqual([[["a.com", "b.com"]], [["c.com"]]]);
  });

  it("serves repeated domains from the short-lived cache", async () => {
    const check = vi.fn(async (domains: string[]) => domains.map(taken));
    const options = { cacheTtlMs: 1_000, now: () => 0, check };

    await searchDomainsEfficiently(["a.com", "b.com"], options);
    await searchDomainsEfficiently(["b.com", "a.com"], options);

    expect(check).toHaveBeenCalledOnce();
  });

  it("refreshes results after the cache expires", async () => {
    let now = 0;
    const check = vi.fn(async (domains: string[]) => domains.map(taken));
    const options = { cacheTtlMs: 1_000, now: () => now, check };

    await searchDomainsEfficiently(["a.com"], options);
    now = 1_001;
    await searchDomainsEfficiently(["a.com"], options);

    expect(check).toHaveBeenCalledTimes(2);
  });
});
