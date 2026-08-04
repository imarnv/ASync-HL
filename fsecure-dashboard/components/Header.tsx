"use client";

import Image from "next/image";
import { LANGUAGES } from "@/lib/languages";

interface HeaderProps {
  language: string;
  onLanguageChange: (language: string) => void;
  voiceEnabled: boolean;
  onVoiceEnabledChange: (enabled: boolean) => void;
}

export function Header({
  language,
  onLanguageChange,
  voiceEnabled,
  onVoiceEnabledChange,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="headerInner">
        <div className="brand">
          <span className="brandMark">
            <Image src="/logo-black.png" alt="Heuristic Labs" width={34} height={34} priority />
          </span>
          <span className="brandText">
            <span className="brandTitle">F&#8209;Secure Support</span>
            <span className="brandSub">Identity Protection assistant</span>
          </span>
        </div>

        <div className="headerControls">
          <span className="pill headerStatus">
            <span className="dot dotSuccess" />
            Agent online
          </span>

          <select
            className="select"
            aria-label="Conversation language"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
          >
            {LANGUAGES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.nativeLabel}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="toggle"
            data-on={voiceEnabled}
            role="switch"
            aria-checked={voiceEnabled}
            onClick={() => onVoiceEnabledChange(!voiceEnabled)}
          >
            <span className="toggleTrack">
              <span className="toggleKnob" />
            </span>
            <span className="toggleLabel">Voice agent</span>
          </button>
        </div>
      </div>
    </header>
  );
}
