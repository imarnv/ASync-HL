import type { KbArticleRef, KbSource } from "./types";

/**
 * The one F-Secure Cyber Help article this assistant currently answers from.
 * Every passage below is attributed to it, so no source chip points at a link
 * that does not exist. Add further articles the same way as the KB is exported.
 */
export const CYBER_HELP_BREACH_ARTICLE: KbArticleRef = {
  title:
    "[Cyber Help] My personal information is available in the Dark Web or another service that was breached is not disclosed. What can I do?",
  url: "https://www.kb.f-secure.com/s/article/Why-doesn-t-the-Identity-theft-report-disclose-the-service-that-was-breached?language=en_US",
};

/** Passages of the article above, split along its own headings. */
export const KB_SOURCES: KbSource[] = [
  {
    id: "breach-source-withheld",
    title: "Why the breached service is not disclosed",
    article: CYBER_HELP_BREACH_ARTICLE,
    keywords: [
      "breach",
      "breached",
      "source",
      "service",
      "not disclosed",
      "undisclosed",
      "name",
      "named",
      "dark web",
      "combo list",
      "report",
      "why",
    ],
    body: [
      "There are several reasons why the source of a breach may not be identified.",
      "",
      "An ongoing law enforcement investigation — data breaches are often investigated by authorities, and publicly disclosing the name of the breached service during an active investigation could interfere with that process. Sensitive source categorisation — some breach sources are classified as sensitive because of the nature of the data or the affected users, and the name is withheld to protect those individuals. Combo lists — a large compilation of data from multiple different breaches, merged into a single dataset and shared on the dark web, where the source information is often lost entirely and cannot be attributed to a single service.",
      "",
      "We will update the breach information as soon as the source becomes publicly available.",
    ].join("\n"),
  },
  {
    id: "password-exposed",
    title: "If a password was exposed",
    article: CYBER_HELP_BREACH_ARTICLE,
    keywords: ["password", "passwords", "credential", "credentials", "login", "reused", "leak"],
    body: [
      "Change that password immediately on every service where you have used it.",
      "",
      "Use a password manager — such as the one included in F-Secure Total — to ensure every account has a strong, unique password going forward.",
    ].join("\n"),
  },
  {
    id: "email-exposed",
    title: "If an email address was exposed",
    article: CYBER_HELP_BREACH_ARTICLE,
    keywords: ["email", "e-mail", "address", "phishing", "scam email", "spam", "alias"],
    body: [
      "Be extra vigilant about phishing emails and unsolicited messages — your address may now be used in targeted scam campaigns.",
      "",
      "Consider using an alias email address for future registrations on less-trusted services.",
    ].join("\n"),
  },
  {
    id: "phone-exposed",
    title: "If a phone number was exposed",
    article: CYBER_HELP_BREACH_ARTICLE,
    keywords: ["phone", "number", "mobile", "sms", "text", "vishing", "smishing", "call", "calls"],
    body: [
      "Be cautious of unsolicited calls or SMS messages asking for personal information — your number may be used in vishing or smishing attacks.",
    ].join("\n"),
  },
  {
    id: "financial-id-exposed",
    title: "If financial or ID data was exposed",
    article: CYBER_HELP_BREACH_ARTICLE,
    keywords: [
      "financial",
      "bank",
      "card",
      "credit",
      "id",
      "identity document",
      "passport",
      "freeze",
      "transaction",
    ],
    body: [
      "Contact your bank immediately and monitor your accounts for suspicious activity.",
      "",
      "Consider placing a credit freeze or lowering your transaction limits as a precaution.",
    ].join("\n"),
  },
  {
    id: "in-all-cases",
    title: "Steps that apply in all cases",
    article: CYBER_HELP_BREACH_ARTICLE,
    keywords: [
      "remediation",
      "guided",
      "monitoring",
      "monitor",
      "alert",
      "alerts",
      "24/7",
      "two-factor",
      "2fa",
      "authentication",
      "dashboard",
      "protect",
    ],
    body: [
      "Enable two-factor authentication on all key accounts if not already active, and protect all your devices with a security solution such as F-Secure Total.",
      "",
      "In your F-Secure Identity Protection dashboard, follow the guided remediation steps provided for your specific breach — these are tailored to the type of data that was exposed. Ensure automated 24/7 identity monitoring is active so you are alerted promptly if your data appears in future breaches.",
    ].join("\n"),
  },
];

/** Naive keyword retrieval, standing in for the real KB search tool. */
export function searchKb(query: string, limit = 2): KbSource[] {
  const haystack = query.toLowerCase();

  const scored = KB_SOURCES.map((source) => {
    const score = source.keywords.reduce(
      (total, keyword) => (haystack.includes(keyword) ? total + keyword.length : total),
      0,
    );
    return { source, score };
  }).filter((entry) => entry.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.source);
}
