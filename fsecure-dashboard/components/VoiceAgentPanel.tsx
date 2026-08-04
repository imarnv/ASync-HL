"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { LockIcon, MicIcon, StopIcon } from "./Icons";

interface VoiceAgentPanelProps {
  enabled: boolean;
  language: string;
  thinking: boolean;
  speaking: boolean;
  onTranscript: (text: string) => void;
}

const FALLBACK_UTTERANCE = "Why doesn't my report say which service was breached?";

export function VoiceAgentPanel({
  enabled,
  language,
  thinking,
  speaking,
  onTranscript,
}: VoiceAgentPanelProps) {
  const [simulating, setSimulating] = useState(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTranscript = useCallback(
    (transcript: string, isFinal: boolean) => {
      if (isFinal && transcript) onTranscript(transcript);
    },
    [onTranscript],
  );

  const recognition = useSpeechRecognition({ language, onTranscript: handleTranscript });
  const { listening, start, stop, supported } = recognition;

  const cancel = useCallback(() => {
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    fallbackTimer.current = null;
    setSimulating(false);
    stop();
  }, [stop]);

  useEffect(() => {
    if (!enabled) cancel();
  }, [enabled, cancel]);

  useEffect(() => cancel, [cancel]);

  const active = listening || simulating;

  function toggle() {
    if (active) {
      cancel();
      return;
    }

    // Without the Web Speech API there is nothing to capture, so stand in a
    // sample utterance to keep the flow demonstrable.
    if (!supported) {
      setSimulating(true);
      fallbackTimer.current = setTimeout(() => {
        setSimulating(false);
        onTranscript(FALLBACK_UTTERANCE);
      }, 1600);
      return;
    }

    start();
  }

  const status = !enabled
    ? "Voice agent is switched off"
    : active
      ? "Listening…"
      : thinking
        ? "Thinking…"
        : speaking
          ? "Speaking…"
          : "Tap the mic to talk";

  return (
    <section className="panel">
      <div className="panelHead">
        <div className="panelTitleWrap">
          <span className="panelIcon">
            <MicIcon size={18} />
          </span>
          <div>
            <div className="panelTitle">Voice agent</div>
            <div className="panelSub">Speak to the agent, hear it reply</div>
          </div>
        </div>
        <span className="pill">
          <span className={`dot ${enabled ? "dotSuccess" : ""}`} />
          {enabled ? "Enabled" : "Disabled"}
        </span>
      </div>

      {!enabled ? (
        <div className="voiceLocked">
          <LockIcon />
          <span>
            Turn on <strong>Voice agent</strong> in the header to speak to the assistant. Chat and
            live calls keep working either way.
          </span>
        </div>
      ) : (
        <div className="voiceStage">
          <div className="micWrap">
            <span className="micRing" />
            <button
              type="button"
              className="micBtn"
              data-listening={active}
              aria-label={active ? "Stop listening" : "Start talking"}
              aria-pressed={active}
              disabled={thinking}
              onClick={toggle}
            >
              {active ? <StopIcon /> : <MicIcon />}
            </button>
          </div>

          <div className="voiceStatus">{status}</div>

          {(active || speaking) && (
            <div className="levels" aria-hidden="true">
              {Array.from({ length: 9 }).map((_, index) => (
                <i key={index} style={{ animationDelay: `${index * 0.08}s` }} />
              ))}
            </div>
          )}

          <p className="hint" style={{ margin: 0 }}>
            {supported
              ? "This asks the agent and speaks the answer. To dictate into the chat box instead, use the mic beside the message field."
              : "This browser has no speech recognition — the mic plays a sample question instead."}
          </p>
        </div>
      )}
    </section>
  );
}
