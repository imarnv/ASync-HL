import { agentApiKey, agentApiUrl, agentTimeoutMs, hasAgentBackend } from "../config";
import type { ChatRequest } from "../api/contracts";
import type { AgentTurn } from "../types";
import { runAgentTurn } from "./core";

/**
 * The single integration seam. Set `AGENT_API_URL` and every channel starts
 * talking to the real F-Secure agent — no component or client code changes.
 *
 * The expected upstream response is `AgentTurn` ({ text, sources, toolCall }).
 * If the backend team's shape differs, map it here and nowhere else.
 */
export async function resolveAgentTurn(request: ChatRequest): Promise<AgentTurn> {
  if (!hasAgentBackend) {
    return runAgentTurn({
      question: request.message,
      language: request.language,
      channel: request.channel,
    });
  }

  const response = await fetch(`${agentApiUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(agentApiKey ? { Authorization: `Bearer ${agentApiKey}` } : {}),
    },
    body: JSON.stringify(request),
    signal: AbortSignal.timeout(agentTimeoutMs),
  });

  if (!response.ok) {
    throw new Error(`Agent backend responded ${response.status}.`);
  }

  return (await response.json()) as AgentTurn;
}
