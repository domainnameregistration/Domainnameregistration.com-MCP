<div align="center">

# Fastest Domain Name Search MCP by Domainnameregistration.com 

### Fast, token-efficient domain name search for AI agents

[![MCP](https://img.shields.io/badge/MCP-HTTP_%2B_stdio-6f42c1?style=for-the-badge)](https://modelcontextprotocol.io/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-Apache_2.0-d22128?style=for-the-badge)](LICENSE)
[![Bulk checks](https://img.shields.io/badge/MCP_Maximum-1%2C000_Domains-0078d4?style=for-the-badge)](#search_domains)
[![Token efficient](https://img.shields.io/badge/Response_Size-88.8%25_Smaller-2ea44f?style=for-the-badge)](#token-efficient-results)
[![Cached P50](https://img.shields.io/badge/Cached_P50-0.890_ms-f97316?style=for-the-badge)](#speed-benchmarks)

**Give Codex, Claude, OpenCode, and other MCP-compatible agents fast access to
bulk ultra fast domain name search from
[Domainnameregistration.com](https://domainnameregistration.com).**

</div>

---

Domain name search is provided by
[Domainnameregistration.com](https://domainnameregistration.com) through this
Model Context Protocol (MCP) server. The Domainnameregistration.com domain name
search lets agents check up to **1,000 domains in one MCP request** and distinguish
available, registered, and aftermarket domains through one compact MCP tool.

**Free API access:** This MCP is also available via API and in a UI for free at
[http://domainnameregistration.com/bulk-domain-checker](http://domainnameregistration.com/bulk-domain-checker).

## Try our the fastet private domain name search in the UI and see brand palletes show up for your domains!

Check out the fastest private domain name search on the internet at
[Domainnameregistration.com](https://domainnameregistration.com).

If you find this MCP or domain name search useful, please consider linking to our
homepage at [https://domainnameregistration.com](https://domainnameregistration.com).
Your link helps more people discover the free service. Thank you so much in
advance.

> [!CAUTION]
> ### Please be gentle with the API
>
> Domain availability capacity is shared by everyone. The service has a global
> limit of **100,000 domain checks per minute across all users**.
>
> - Submit only domains you genuinely need to research.
> - Batch related domains into a single request.
> - Do not send repeated, aggressive, or wasteful automated requests.
> - Please be respectful of everyone sharing this service.
>
> To protect shared capacity, repeated excessive use may trigger an **automatic
> IP ban**. If legitimate usage frequently reaches the MCP or API limits, please
> open a GitHub issue. We will review the use case and evaluate whether capacity
> can be increased.

## Contact

For questions, feedback, support, or higher-capacity use cases, contact
Domainnameregistration.com at
[http://domainnameregistration.com/contact](http://domainnameregistration.com/contact).

## Table of contents

- [MCP capabilities](#mcp-capabilities)
- [Availability statuses](#availability-statuses)
- [Installation](#installation)
- [API endpoint](#api-endpoint)
- [Run the server](#run-the-server)
- [Transport compatibility](#transport-compatibility)
- [`search_domains`](#search_domains)
- [Token-efficient results](#token-efficient-results)
- [Context-window cost](#context-window-cost)
- [Fast and considerate request handling](#fast-and-considerate-request-handling)
- [Speed benchmarks](#speed-benchmarks)
- [Connect an agent](#connect-an-agent)
- [Direct MCP request](#direct-mcp-request)
- [Development](#development)
- [Limits and responsible use](#limits-and-responsible-use)
- [Troubleshooting](#troubleshooting)
- [Security](#security)

---

## MCP capabilities

- One focused MCP tool: `search_domains`
- Bulk domain name search for 1 to 1,000 fully qualified domain names per MCP call
- A hard 1,000-domain schema limit that protects agent context windows
- Streamable HTTP for hosted and remote clients
- stdio for local clients and desktop applications
- Compact results designed to minimize agent token usage
- Input normalization and validation
- Automatic duplicate removal before upstream submission
- Short-lived, in-memory result cache with no external data store
- Small sequential upstream batches to reduce traffic bursts
- Bounded retries for safe transient failures
- Canonical Domainnameregistration.com availability endpoint
- Configurable request timeout and deployment settings
- MCP integrations for Codex, Claude Code, Claude Desktop, OpenCode, Cursor,
  Visual Studio Code, GitHub Copilot, Gemini CLI, Zed, and generic MCP clients
- Cross-platform Node.js support on macOS, Linux, and Windows

## Availability statuses

The Domainnameregistration.com domain name search API uses these numeric status
codes internally:

| Code | MCP group | Meaning |
| ---: | --- | --- |
| `0` | `available` | The domain appears available for registration. |
| `1` | `taken` | The domain is registered or otherwise unavailable. |
| `2` | `noInfo` | No conclusive availability information was returned. |
| `3` | `aftermarket` | The domain is listed or otherwise identified as aftermarket inventory. |

Availability data can change quickly. Agents and users should recheck a domain
immediately before attempting to register or purchase it.

## Requirements

- Node.js 20 or newer
- npm
- Access to the Domainnameregistration.com bulk-check API

## Installation

```bash
npm install
npm run build
```

## API endpoint

All domain name search checks are sent by `POST` to the canonical public endpoint:

```text
https://domainnameregistration.com/availability/bulk-check
```

The request body contains an array of domains:

```json
{"domains":["example.com","example.ai"]}
```

The API URL is fixed in the server rather than exposed as user-facing
configuration. The hosting environment supplies the MCP server's listening
configuration.

| Environment variable | Default | Purpose |
| --- | ---: | --- |
| `REQUEST_TIMEOUT_MS` | `15000` | Timeout for each upstream attempt |
| `DOMAIN_CACHE_TTL_MS` | `60000` | How long successful results remain in memory |
| `UPSTREAM_BATCH_SIZE` | `250` | Maximum domains in each sequential upstream request |

The HTTP transport accepts JSON bodies up to **10 MB**. A maximum-size valid
1,000-domain request is approximately 0.3 MB, so this leaves substantial room
for long domain names and the MCP JSON-RPC envelope. The larger transport ceiling
does not change the enforced tool limit of 1,000 domains or the 253-character
limit for each domain.

## Run the server

Build the project first:

```bash
npm run build
```

### Streamable HTTP

Start the HTTP server in an environment that provides its standard listening
configuration:

```bash
npm start
```

Deploy the MCP behind HTTPS. Its client-facing paths are:

- `/mcp` for Streamable HTTP MCP requests
- `/health` for service health checks

Expected health response:

```json
{"ok":true,"service":"domain-availability-mcp"}
```

### Local stdio

Run the local MCP process over standard input and output:

```bash
npm run start:stdio
```

MCP clients normally launch this process themselves, so users generally do not
run it manually. The executable writes protocol messages only to stdout and sends
diagnostic messages to stderr, as required by stdio MCP clients.

## Transport compatibility

Both current standard MCP transports use the same `search_domains` implementation:

| Transport | Best for | How it starts |
| --- | --- | --- |
| **Streamable HTTP** | Hosted services, teams, remote agents, web-accessible deployments | Connect to the public HTTPS `/mcp` URL |
| **stdio** | Desktop apps, IDEs, CLIs, private local use | Client launches `node /absolute/path/to/dist/stdio.js` |

| Client | Streamable HTTP | stdio |
| --- | :---: | :---: |
| Codex | Yes | Yes |
| Claude Code | Yes | Yes |
| Claude Desktop | Remote connector | Local developer server |
| OpenCode | Yes | Yes |
| Cursor | Yes | Yes |
| Visual Studio Code / GitHub Copilot | Yes | Yes |
| Gemini CLI | Yes | Yes |
| Zed | Yes | Yes |
| Generic standards-compliant MCP clients | Yes | Yes |

> [!TIP]
> Choose HTTP when the MCP is deployed once for multiple users. Choose stdio when
> each user has a local copy and their client should manage the server process.

The older standalone HTTP+SSE transport is intentionally not implemented. It has
been superseded by Streamable HTTP; modern clients should use HTTP or stdio.

## `search_domains`

Performs token-efficient domain name search in bulk.

Input:

```json
{
  "domains": ["example.com", "example.ai", "example.net"]
}
```

The `domains` array:

- Must contain between 1 and 1,000 entries.
- Must contain fully qualified domain names such as `example.com`.
- Is trimmed and converted to lowercase before submission.
- Is deduplicated before any upstream request.
- Returns each unique, valid domain once.

Compact output:

```json
{
  "available": ["example.ai"],
  "taken": ["example.com"],
  "noInfo": [],
  "aftermarket": ["example.net"]
}
```

## Token-efficient results

Each domain appears once, grouped by its result. The MCP deliberately avoids
repeating field names, numeric codes, and labels for every domain. It also avoids
returning duplicate text and structured payloads.

| Response format | Wire size | Approximate tokens |
| --- | ---: | ---: |
| Previous per-domain format | 12,350 bytes | ~3,088 |
| Current grouped format | 1,387 bytes | ~347 |
| **Reduction** | **88.8%** | **~2,741 fewer** |

> [!NOTE]
> Measurements use the same 67-domain result set. Byte counts are exact; token
> counts are estimates because model-specific tokenizers vary.

<a id="context-window-cost"></a>

## Context-window cost

MCP responses are inserted into the agent's context so the model can parse and
reason about them. Even a token-efficient JSON format can become expensive when
thousands of domain names are returned.

| Domains in response | Measured response size | Estimated response tokens |
| ---: | ---: | ---: |
| **250** | 8,386 bytes | **~2,100 tokens** |
| **1,000** | 33,136 bytes | **~8,300 tokens** |
| **5,000 (historical comparison)** | 165,136 bytes | **~41,300 tokens** |

These estimates cover **only the response that the agent must receive and
parse**. They exclude the tool-call input, tool schema, surrounding conversation,
and the agent's answer. A 1,000-domain round trip may use roughly 16,000 tokens
after counting both the submitted list and returned list. The historical
5,000-domain test could approach 80,000 total tokens.

For this reason, the MCP now rejects more than **1,000 domains per call**. Agents
should normally use 100–500 and process larger lists through sequential calls.
Actual token usage varies by domain length, status distribution, client, model,
and tokenizer.

## Fast and considerate request handling

The MCP keeps optimization local and intentionally simple. Its short-lived cache
exists only in memory, and no cache contents or usage analytics are persisted.

For every tool call, it:

1. Normalizes and validates the submitted domains.
2. Removes duplicates while preserving first-seen order.
3. Serves recent successful results from a short-lived memory cache.
4. Splits uncached domains into small sequential upstream batches.
5. Retries only bounded, transient failures.
6. Returns one compact grouped result.

The default cache lasts **60 seconds** and exists only in the running MCP process.
It is cleared automatically as entries expire and disappears completely when the
process restarts. No cache contents or usage analytics are persisted.

The default upstream batch size is **250 domains**. To create gentler, smaller
bursts, reduce it through the environment:

```bash
UPSTREAM_BATCH_SIZE=100 npm start
```

Reducing batch size changes the shape of upstream traffic, not the number of
unique domains counted against the shared service limit.

### Safe retry policy

- At most two retries are attempted after the initial request.
- Network failures and HTTP `408`, `425`, `500`, `502`, `503`, and `504` may retry.
- HTTP `429` retries only when the API supplies a valid `Retry-After` of five
  seconds or less.
- Backoff is exponential with jitter, starting around 250 milliseconds.
- Validation errors and other client errors are never retried.
- Only successful responses enter the cache.

### Guidance for agents

The MCP tool schema enforces **1,000 domains as the maximum per call**. For larger
research jobs:

1. Remove obvious duplicates before calling the tool.
2. Submit batches sequentially rather than in parallel.
3. Start with 100–500 domains per call for interactive research.
4. Never exceed 1,000 domains in a call; split larger lists into sequential calls.
5. Avoid immediately rechecking the same names; the MCP cache is intentionally
   short-lived, and domain availability does not need millisecond polling.

Calls of 100–500 domains are recommended for interactive work. The 1,000-domain
maximum remains available for legitimate bulk workflows. Smaller calls improve
fairness, produce faster incremental answers, reduce the impact of a failed
request, and consume less model context at one time.

<a id="speed-benchmarks"></a>

## Speed benchmarks

The current domain name search MCP was benchmarked through its complete
Streamable HTTP request path with the MCP cache cleared before every measured
request.

| Unique domains | Internal API batches | Runs | P50 | P95 |
| ---: | ---: | ---: | ---: | ---: |
| **250** | 1 | 10 | **9.101 ms** | **15.897 ms** |
| **1,000** | 4 | 10 | **31.050 ms** | **39.784 ms** |
| **5,000 (historical)** | 20 | 10 | **150.724 ms** | **239.019 ms** |

- **P50** is the median response time: half of measured requests completed at or
  below this value.
- **P95** is the tail-latency measurement: 95% of measured requests completed at
  or below this value.
- Percentiles use the nearest-rank method.
- Every dataset contained unique domains and every run was fully uncached at the
  MCP layer.
- The benchmark used the normal retry policy and default 250-domain internal
  batch size.
- All 250 measured upstream batch requests returned HTTP `200`; no retry path was
  needed.
- The experiment submitted 62,500 domains in total, remaining below the shared
  100,000-check rolling limit.
- With 10 samples, nearest-rank P95 is the slowest observed run for each size.

The 5,000-domain row records the transport-capacity experiment performed before
the context-protection limit was introduced. The current MCP rejects that size
and accepts at most 1,000 domains per call.

> [!NOTE]
> These are fully uncached development measurements with the API co-located with
> the MCP, not a production SLA. Public deployment latency varies with network
> distance, host load, TLS termination, and upstream conditions.

## Connect an agent

Before using a local configuration, replace
`/absolute/path/to/domain-availability-mcp` with the absolute path to this
project. Run `npm install && npm run build` once before the client launches it.

### Codex

Local stdio:

```bash
codex mcp add domain-availability -- \
  node /absolute/path/to/domain-availability-mcp/dist/stdio.js
```

Hosted Streamable HTTP:

```bash
codex mcp add domain-availability --url https://your-mcp-server.example/mcp
```

Verify the configuration:

```bash
codex mcp get domain-availability
```

Open a new Codex task after adding the server so Codex can load the new tool.
Example requests include:

```text
Check whether example.com, example.ai, and example.net are available.
```

```text
Generate 20 names for a developer tool, then check the matching .com domains.
Show only domains reported as available.
```

To remove the server:

```bash
codex mcp remove domain-availability
```

### Claude Code

Local stdio:

```bash
claude mcp add domain-availability -- \
  node /absolute/path/to/domain-availability-mcp/dist/stdio.js
```

Hosted Streamable HTTP:

```bash
claude mcp add --transport http domain-availability \
  https://your-mcp-server.example/mcp
```

Verify it:

```bash
claude mcp get domain-availability
```

Inside Claude Code, `/mcp` can be used to inspect configured MCP servers.

### Claude Desktop

For a developer-defined local server, add the stdio command to Claude Desktop's
MCP configuration:

```json
{
  "mcpServers": {
    "domain-availability": {
      "command": "node",
      "args": [
        "/absolute/path/to/domain-availability-mcp/dist/stdio.js"
      ]
    }
  }
}
```

Restart Claude Desktop after changing its configuration. For easier end-user
distribution, the same stdio entry point can later be packaged as a Desktop
Extension (`.dxt`). A hosted HTTPS deployment can be added as a remote custom
connector where supported by the user's plan and organization policy.

### OpenCode

OpenCode supports local and remote MCP servers. Local stdio configuration:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "domain-availability": {
      "type": "local",
      "command": [
        "node",
        "/absolute/path/to/domain-availability-mcp/dist/stdio.js"
      ],
      "enabled": true
    }
  }
}
```

Hosted Streamable HTTP configuration:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "domain-availability": {
      "type": "remote",
      "url": "https://your-mcp-server.example/mcp",
      "enabled": true
    }
  }
}
```

After restarting OpenCode, ask it to use `domain-availability` or the
`search_domains` tool. Run `opencode mcp list` to inspect the connection.

### Cursor

Add a local server to `.cursor/mcp.json` in a project or `~/.cursor/mcp.json`
globally:

```json
{
  "mcpServers": {
    "domain-availability": {
      "command": "node",
      "args": [
        "/absolute/path/to/domain-availability-mcp/dist/stdio.js"
      ]
    }
  }
}
```

Cursor also supports Streamable HTTP. Use its MCP settings UI or replace the
local command with the deployed MCP URL according to the current Cursor schema.

### Visual Studio Code and GitHub Copilot

Create `.vscode/mcp.json` for a workspace or use **MCP: Open User
Configuration** for a profile-wide installation:

```json
{
  "servers": {
    "domain-availability": {
      "type": "stdio",
      "command": "node",
      "args": [
        "/absolute/path/to/domain-availability-mcp/dist/stdio.js"
      ]
    }
  }
}
```

For a hosted deployment, use an HTTP server entry:

```json
{
  "servers": {
    "domain-availability": {
      "type": "http",
      "url": "https://your-mcp-server.example/mcp"
    }
  }
}
```

### Gemini CLI

Add stdio through the CLI:

```bash
gemini mcp add domain-availability \
  node /absolute/path/to/domain-availability-mcp/dist/stdio.js
```

Or add it to `~/.gemini/settings.json` or `.gemini/settings.json`:

```json
{
  "mcpServers": {
    "domain-availability": {
      "command": "node",
      "args": [
        "/absolute/path/to/domain-availability-mcp/dist/stdio.js"
      ]
    }
  }
}
```

For Streamable HTTP, use an `httpUrl` server entry pointing to the deployed
`/mcp` URL. Run `gemini mcp list` or `/mcp list` to verify discovery.

### Zed

Add a local context server through **Settings → AI → MCP Servers**, or add this
to Zed's settings:

```json
{
  "context_servers": {
    "domain-availability": {
      "command": "node",
      "args": [
        "/absolute/path/to/domain-availability-mcp/dist/stdio.js"
      ],
      "env": {}
    }
  }
}
```

Zed also accepts a remote entry with
`"url": "https://your-mcp-server.example/mcp"`.

### Other MCP clients

The server is not tied to one model vendor. Any client that supports the standard
MCP transports can connect using one of these generic shapes.

Generic stdio definition:

```json
{
  "command": "node",
  "args": ["/absolute/path/to/domain-availability-mcp/dist/stdio.js"]
}
```

Generic Streamable HTTP definition:

```json
{
  "type": "http",
  "url": "https://your-mcp-server.example/mcp"
}
```

This covers clients and extensions that use the common `mcpServers` JSON shape,
including many releases of Windsurf, Cline, Roo Code, Continue, and other
MCP-enabled IDE tools. Their configuration file locations and wrapper keys vary,
but the command, arguments, URL, tool name, input, and output remain the same.

## Direct MCP request

The following JSON-RPC request invokes `search_domains` without an agent client:

```bash
curl https://your-mcp-server.example/mcp \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json, text/event-stream' \
  -H 'MCP-Protocol-Version: 2025-06-18' \
  --data-binary '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "search_domains",
      "arguments": {
        "domains": ["example.com", "example.ai"]
      }
    }
  }'
```

## Development

Run the TypeScript source in watch mode:

```bash
npm run dev
```

Run the stdio entry point in watch mode:

```bash
npm run dev:stdio
```

Build the production JavaScript:

```bash
npm run build
```

Run the automated tests:

```bash
npm test
```

The tests cover API response mapping, domain normalization, deduplication,
short-lived caching, sequential batching, bounded retries, upstream error
handling, and compact response grouping.

## Limits and responsible use

The public bulk-check API accepts up to **5,000 domains per request**, but this MCP
deliberately caps agent calls at **1,000 domains** to protect model context
windows. The API is capped at **100,000 domain checks per minute globally across
all users**. This is shared capacity, so please use the service gently and leave
room for others.

Clients should:

- Use 100–500 domains per call when practical; never exceed the 1,000 maximum.
- Submit large jobs as sequential batches rather than parallel bursts.
- Submit only domains needed for the current research task.
- Avoid retry loops without delays or backoff.
- Avoid repeatedly checking the same domains when a recent result is sufficient.
- Treat `noInfo` as inconclusive rather than available.
- Treat `aftermarket` separately from ordinary registration availability.
- Recheck important domains before registration, bidding, or purchase.

The MCP deduplicates, caches briefly, and internally batches requests, but the
upstream service remains the source of truth for global rate-limit enforcement.

> [!WARNING]
> Repeated excessive requests may be automatically blocked by IP. If a legitimate
> workflow regularly reaches the limit, open a GitHub issue with the approximate
> request volume and use case so the capacity requirement can be evaluated.

## Troubleshooting

Tool failures are returned as MCP errors with a concise explanation. Common
causes include:

- An invalid or incomplete domain name
- More than 1,000 domains in one MCP request
- The upstream API being unavailable
- An upstream non-success HTTP response
- A request exceeding `REQUEST_TIMEOUT_MS`
- A malformed or misaligned upstream response

If the health endpoint works but domain searches fail, test the canonical API
endpoint directly and confirm it is accepting `POST` requests with a JSON body.

## Security

Before exposing the MCP publicly:

- Put it behind HTTPS.
- Add authentication and authorization appropriate to the deployment.
- Apply per-client rate limits in addition to the API's global limit.
- Restrict allowed hosts and origins as appropriate.
- Keep Node.js and MCP dependencies updated.

## Project structure

```text
src/
  http-app.ts         Streamable HTTP app and large-request handling
  index.ts            HTTP server and MCP transport
  stdio.ts            Local stdio MCP transport
  server.ts           search_domains tool and compact result formatting
  domain-api.ts       Domainnameregistration.com API client
  domain-service.ts   Deduplication, memory cache, and sequential batching
  domain-api.test.ts  API client tests
  domain-service.test.ts Cache and batching tests
  http-app.test.ts    Maximum-size HTTP regression test
  server.test.ts      Compact-output tests
```

## License

Licensed under the [Apache License, Version 2.0](LICENSE). The repository includes
the complete, unmodified official license text.
