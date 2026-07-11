import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  DomainApiError,
  type DomainResult,
  normalizeDomains,
} from "./domain-api.js";
import { searchDomainsEfficiently } from "./domain-service.js";

const domainSchema = z
  .string()
  .trim()
  .min(1)
  .max(253)
  .regex(
    /^(?=.{1,253}\.?$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}\.?$/,
    "Must be a fully-qualified domain such as example.com",
  );

export function createServer(): McpServer {
  const server = new McpServer({
    name: "domain-availability",
    version: "0.1.0",
  });

  server.registerTool(
    "search_domains",
    {
      description:
        "Bulk domain name search, maximum 1,000 per call. Returns available, taken, noInfo, and aftermarket groups.",
      inputSchema: {
        domains: z
          .array(z.string())
          .min(1)
          .max(1_000),
      },
    },
    async ({ domains }) => {
      try {
        const normalized = normalizeDomains(domains);
        const invalid = normalized.find((domain) => !domainSchema.safeParse(domain).success);
        if (invalid) {
          return {
            isError: true,
            content: [{ type: "text", text: `Invalid domain: ${invalid}` }],
          };
        }

        const results = await searchDomainsEfficiently(normalized);
        return {
          content: [{ type: "text", text: JSON.stringify(groupResults(results)) }],
        };
      } catch (error) {
        const message =
          error instanceof DomainApiError
            ? error.message
            : "An unexpected domain lookup error occurred.";
        return {
          isError: true,
          content: [{ type: "text", text: message }],
        };
      }
    },
  );

  return server;
}

export function groupResults(results: DomainResult[]) {
  const grouped: {
    available: string[];
    taken: string[];
    noInfo: string[];
    aftermarket: string[];
  } = { available: [], taken: [], noInfo: [], aftermarket: [] };

  for (const result of results) {
    if (result.status === 0) grouped.available.push(result.domain);
    else if (result.status === 1) grouped.taken.push(result.domain);
    else if (result.status === 2) grouped.noInfo.push(result.domain);
    else grouped.aftermarket.push(result.domain);
  }

  return grouped;
}
