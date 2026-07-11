import { describe, expect, it, vi } from "vitest";
import { checkDomainAvailability, normalizeDomains } from "./domain-api.js";

describe("domain API client", () => {
  it("normalizes input domains", () => {
    expect(normalizeDomains([" Example.COM ", "OPENAI.com"])).toEqual([
      "example.com",
      "openai.com",
    ]);
  });

  it("maps aligned arrays to labeled results", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          domains: ["available.test", "taken.test", "unknown.test", "market.test"],
          status: [0, 1, 2, 3],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    );

    const results = await checkDomainAvailability(
      ["available.test", "taken.test", "unknown.test", "market.test"],
      { fetchImpl },
    );

    expect(results.map((result) => result.statusLabel)).toEqual([
      "available",
      "taken",
      "no_info",
      "aftermarket",
    ]);
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("surfaces an upstream HTTP failure", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("blocked", { status: 429 }));

    await expect(
      checkDomainAvailability(["example.com"], { fetchImpl }),
    ).rejects.toThrow("HTTP 429: blocked");
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it("retries bounded transient failures", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response("busy", { status: 503 }))
      .mockResolvedValueOnce(new Response("busy", { status: 502 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ domains: ["example.com"], statuses: [1] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      );
    const sleepImpl = vi.fn(async () => undefined);

    const result = await checkDomainAvailability(["example.com"], {
      fetchImpl,
      retryBaseDelayMs: 0,
      sleepImpl,
    });

    expect(result[0]?.statusLabel).toBe("taken");
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleepImpl).toHaveBeenCalledTimes(2);
  });

  it("honors a short Retry-After on rate limits", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response("limited", { status: 429, headers: { "retry-after": "0" } }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ domains: ["example.com"], statuses: [1] }), {
          status: 200,
        }),
      );
    const sleepImpl = vi.fn(async () => undefined);

    await checkDomainAvailability(["example.com"], { fetchImpl, sleepImpl });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleepImpl).toHaveBeenCalledWith(0);
  });
});
