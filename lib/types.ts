/** The three transports the F-Secure agent is exposed through. */
export type Channel = "chat" | "voice" | "call";

export interface LanguageOption {
  /** BCP-47 tag handed to speech synthesis / recognition. */
  code: string;
  label: string;
  nativeLabel: string;
}

export interface KbArticleRef {
  title: string;
  url: string;
}

/** A retrievable passage, always attributed to the KB article it came from. */
export interface KbSource {
  id: string;
  /** Heading of the passage within the article. */
  title: string;
  article: KbArticleRef;
  keywords: string[];
  body: string;
}

export interface ToolCall {
  name: string;
  args: Record<string, string>;
}

export interface AgentTurn {
  text: string;
  sources: KbSource[];
  toolCall?: ToolCall;
}

export interface ChatMessage {
  id: string;
  role: "user" | "agent";
  text: string;
  channel: Channel;
  sources?: KbSource[];
  toolCall?: ToolCall;
  /** Set when the turn failed, so the bubble reads as a fault, not an answer. */
  error?: boolean;
}

export type CallStatus = "idle" | "dialing" | "connected" | "ended";

export interface CallRecord {
  id: string;
  phone: string;
  direction: "inbound" | "outbound";
  durationSeconds: number;
  topic: string;
  outcome: "resolved" | "escalated" | "missed";
}
