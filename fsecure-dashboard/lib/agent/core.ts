import { searchKb } from "../kb";
import { languageLabel } from "../languages";
import type { AgentTurn, Channel, ToolCall } from "../types";

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+\.[\w.-]+/;

/**
 * Local stand-in for the F-Secure agent, used until `AGENT_API_URL` is set.
 * Runs server-side only, so the KB never reaches the browser bundle.
 *
 * All three channels resolve here, which is what stops chat, voice and calls
 * from drifting apart — only the presentation is channel-specific.
 */
export function runAgentTurn(options: {
  question: string;
  language: string;
  channel: Channel;
}): AgentTurn {
  const { question, language, channel } = options;

  const email = question.match(EMAIL_PATTERN)?.[0];
  const sources = searchKb(question);

  const toolCall: ToolCall = email
    ? { name: "identity.lookupBreaches", args: { email, locale: language } }
    : { name: "kb.search", args: { query: truncate(question, 48), locale: language } };

  if (email) {
    return {
      text: withVoiceTrim(
        `I can look up ${email} against our breach records. Once the check returns I will walk you through the remediation steps for whichever data type was exposed.`,
        channel,
      ),
      sources,
      toolCall,
    };
  }

  if (sources.length === 0) {
    return {
      text: withVoiceTrim(
        `I could not match that to an article in the F-Secure knowledge base. Try asking about an exposed password, email address or phone number, why a breach source is undisclosed, or identity monitoring. I can also hand you to a human agent in ${languageLabel(language)}.`,
        channel,
      ),
      sources,
      toolCall,
    };
  }

  return {
    text: withVoiceTrim(sources[0].body, channel),
    sources,
    toolCall,
  };
}

/** Voice turns keep the first paragraph only; long prose does not work read aloud. */
function withVoiceTrim(text: string, channel: Channel): string {
  if (channel === "chat") return text;
  return text.split("\n\n")[0];
}

function truncate(value: string, max: number): string {
  const clean = value.trim().replace(/\s+/g, " ");
  return clean.length <= max ? clean : `${clean.slice(0, max - 1)}…`;
}
