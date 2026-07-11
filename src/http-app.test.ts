import { once } from "node:events";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearDomainCache } from "./domain-service.js";
import { createDomainMcpApp } from "./http-app.js";

describe("Streamable HTTP MCP", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    clearDomainCache();
  });

  it("accepts a valid 1,000-domain MCP request", async () => {
    const domains = Array.from(
      { length: 1_000 },
      (_, index) => {
        const uniqueLabel = `b${String(index).padStart(6, "0")}${"x".repeat(52)}`;
        const longLabel = "x".repeat(60);
        return `${uniqueLabel}.${longLabel}.${longLabel}.${longLabel}.com`;
      },
    );
    const realFetch = globalThis.fetch;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const submitted = JSON.parse(String(init?.body)).domains as string[];
        return new Response(
          JSON.stringify({
            domains: submitted,
            statuses: submitted.map(() => 3),
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }),
    );

    const app = createDomainMcpApp({ host: "127.0.0.1" });
    const server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    const { port } = server.address() as AddressInfo;

    try {
      const response = await realFetch(`http://127.0.0.1:${port}/mcp`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json, text/event-stream",
          "mcp-protocol-version": "2025-06-18",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: "search_domains", arguments: { domains } },
        }),
      });
      const payload = await response.json();
      const grouped = JSON.parse(payload.result.content[0].text);

      expect(response.status).toBe(200);
      expect(grouped.aftermarket).toHaveLength(1_000);
    } finally {
      server.close();
      await once(server, "close");
    }
  });
});
