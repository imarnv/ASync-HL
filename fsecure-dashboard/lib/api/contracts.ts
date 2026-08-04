import type { AgentTurn, Channel, KbSource, ToolCall } from "../types";

export const CHAT_ENDPOINT = "/api/chat";

const CHANNELS: Channel[] = ["chat", "voice", "call"];
const MAX_MESSAGE_LENGTH = 2000;

export interface ChatRequest {
  message: string;
  language: string;
  channel: Channel;
}

export type ChatResponse = AgentTurn;

export interface ApiErrorBody {
  error: string;
}

/**
 * Hand-rolled validation so the route has no schema dependency. Swap for zod if
 * the backend contract grows beyond a few fields.
 */
export function parseChatRequest(value: unknown): ChatRequest | string {
  if (typeof value !== "object" || value === null) return "Body must be a JSON object.";

  const { message, language, channel } = value as Record<string, unknown>;

  if (typeof message !== "string" || message.trim().length === 0) {
    return "`message` is required.";
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return `\`message\` must be ${MAX_MESSAGE_LENGTH} characters or fewer.`;
  }
  if (typeof language !== "string" || language.length === 0) {
    return "`language` is required.";
  }
  if (typeof channel !== "string" || !CHANNELS.includes(channel as Channel)) {
    return `\`channel\` must be one of: ${CHANNELS.join(", ")}.`;
  }

  return { message: message.trim(), language, channel: channel as Channel };
}

/**
 * Coerces whatever the agent returned into a shape the UI can render. A source
 * missing its article reference is dropped rather than allowed to crash the
 * transcript — the answer text still gets through.
 */
export function normalizeAgentTurn(value: unknown): AgentTurn {
  const turn = (value ?? {}) as Partial<AgentTurn>;

  return {
    text: typeof turn.text === "string" ? turn.text : "",
    sources: Array.isArray(turn.sources) ? turn.sources.filter(isRenderableSource) : [],
    toolCall: isRenderableToolCall(turn.toolCall) ? turn.toolCall : undefined,
  };
}

function isRenderableSource(value: unknown): value is KbSource {
  const source = value as Partial<KbSource> | null;
  return (
    !!source &&
    typeof source.id === "string" &&
    typeof source.title === "string" &&
    !!source.article &&
    typeof source.article.url === "string" &&
    typeof source.article.title === "string"
  );
}

function isRenderableToolCall(value: unknown): value is ToolCall {
  const toolCall = value as Partial<ToolCall> | null;
  return !!toolCall && typeof toolCall.name === "string" && typeof toolCall.args === "object";
}
