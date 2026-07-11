import express, { type Express } from "express";
import { hostHeaderValidation, localhostHostValidation } from "@modelcontextprotocol/sdk/server/middleware/hostHeaderValidation.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";

// A worst-case valid 1,000-domain request is roughly 0.3 MB. Keep substantial
// transport headroom while the tool schema and domain validator enforce the
// actual 1,000-item and 253-character-per-domain limits.
const MAX_MCP_BODY_SIZE = "10mb";

export function createDomainMcpApp(options: {
  host: string;
  allowedHosts?: string[];
}): Express {
  const app = express();
  app.use(express.json({ limit: MAX_MCP_BODY_SIZE }));

  if (options.allowedHosts?.length) {
    app.use(hostHeaderValidation(options.allowedHosts));
  } else if (["127.0.0.1", "localhost", "::1"].includes(options.host)) {
    app.use(localhostHostValidation());
  }

  app.get("/health", (_req, res) => {
    res.json({ ok: true, service: "domain-availability-mcp" });
  });

  app.post("/mcp", async (req, res) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on("close", () => {
      void transport.close();
      void server.close();
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP request failed:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.all("/mcp", (_req, res) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: "Method not allowed" },
      id: null,
    });
  });

  return app;
}
