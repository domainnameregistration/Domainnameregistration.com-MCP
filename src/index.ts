import { createDomainMcpApp } from "./http-app.js";

const host = process.env.HOST ?? "0.0.0.0";
const port = Number(process.env.PORT);

if (!Number.isInteger(port) || port < 1) {
  throw new Error("The hosting environment must provide a valid PORT.");
}
const allowedHosts = process.env.ALLOWED_HOSTS
  ?.split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const app = createDomainMcpApp({ host, allowedHosts });

app.listen(port, host, () => {
  console.log(`Domain Availability MCP listening at http://${host}:${port}/mcp`);
});
