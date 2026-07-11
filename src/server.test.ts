import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";
import { createServer, groupResults } from "./server.js";

describe("compact MCP output", () => {
  it("groups domains without repeating status metadata", () => {
    expect(
      groupResults([
        { domain: "free.test", status: 0, statusLabel: "available" },
        { domain: "used.test", status: 1, statusLabel: "taken" },
        { domain: "unknown.test", status: 2, statusLabel: "no_info" },
        { domain: "auction.test", status: 3, statusLabel: "aftermarket" },
      ]),
    ).toEqual({
      available: ["free.test"],
      taken: ["used.test"],
      noInfo: ["unknown.test"],
      aftermarket: ["auction.test"],
    });
  });

  it("advertises a hard maximum of 1,000 domains", async () => {
    const server = createServer();
    const client = new Client({ name: "schema-test", version: "1.0.0" });
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const tool = (await client.listTools()).tools.find(
      ({ name }) => name === "search_domains",
    );

    expect(tool?.inputSchema.properties?.domains).toMatchObject({
      maxItems: 1_000,
    });

    const rejected = await client.callTool({
      name: "search_domains",
      arguments: {
        domains: Array.from(
          { length: 1_001 },
          (_, index) => `over-limit-${index}.com`,
        ),
      },
    });
    expect(rejected.isError).toBe(true);

    await client.close();
    await server.close();
  });
});
