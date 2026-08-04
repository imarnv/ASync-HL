/**
 * Server-only configuration. These are read inside route handlers, never in
 * client components, so the key is not shipped to the browser.
 */
export const agentApiUrl = process.env.AGENT_API_URL?.replace(/\/$/, "") ?? "";
export const agentApiKey = process.env.AGENT_API_KEY ?? "";
export const agentTimeoutMs = Number(process.env.AGENT_TIMEOUT_MS ?? 15000);

/** False until the backend team's endpoint is configured; the stub answers instead. */
export const hasAgentBackend = agentApiUrl.length > 0;
