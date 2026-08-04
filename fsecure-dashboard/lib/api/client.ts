import { CHAT_ENDPOINT, type ChatRequest, type ChatResponse } from "./contracts";

/**
 * The browser's only route to the agent. Every channel goes through here, so
 * pointing the app at a different backend is a server-side change alone.
 */
export async function requestChatTurn(
  body: ChatRequest,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const response = await fetch(CHAT_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const detail = await response
      .json()
      .then((payload: { error?: string }) => payload.error)
      .catch(() => undefined);
    throw new Error(detail ?? `Agent request failed (${response.status}).`);
  }

  return (await response.json()) as ChatResponse;
}
