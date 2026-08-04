import type { LanguageOption } from "./types";

/**
 * F-Secure's core markets. The demo dropdown on Eloquent only switches accent,
 * so these need matching KB translations before they are more than a UI control.
 */
export const LANGUAGES: LanguageOption[] = [
  { code: "en-US", label: "English", nativeLabel: "English" },
  { code: "fi-FI", label: "Finnish", nativeLabel: "Suomi" },
  { code: "sv-SE", label: "Swedish", nativeLabel: "Svenska" },
  { code: "da-DK", label: "Danish", nativeLabel: "Dansk" },
  { code: "nb-NO", label: "Norwegian", nativeLabel: "Norsk" },
  { code: "de-DE", label: "German", nativeLabel: "Deutsch" },
  { code: "fr-FR", label: "French", nativeLabel: "Français" },
];

export const DEFAULT_LANGUAGE = LANGUAGES[0].code;

export function languageLabel(code: string): string {
  return LANGUAGES.find((language) => language.code === code)?.label ?? code;
}
