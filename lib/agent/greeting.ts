import { languageLabel } from "../languages";
import type { Channel } from "../types";

/** Client-safe: renders the opening line without pulling the KB into the bundle. */
export function greeting(language: string, channel: Channel): string {
  const opener =
    channel === "chat"
      ? "You're through to F-Secure Support."
      : "You're connected to F-Secure Support.";

  return `${opener} I answer from the F-Secure knowledge base and can check your details against our breach records. We're speaking ${languageLabel(language)} — ask me anything about a breach report or identity protection.`;
}
