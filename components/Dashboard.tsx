"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { greeting } from "@/lib/agent/greeting";
import { requestChatTurn } from "@/lib/api/client";
import { DEFAULT_LANGUAGE, languageLabel } from "@/lib/languages";
import type { Channel, ChatMessage } from "@/lib/types";
import { ChatPanel } from "./ChatPanel";
import { Header } from "./Header";
import { LiveCallPanel } from "./LiveCallPanel";
import { VoiceAgentPanel } from "./VoiceAgentPanel";

export function Dashboard() {
  const [language, setLanguage] = useState(DEFAULT_LANGUAGE);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "turn-0",
      role: "agent",
      text: greeting(DEFAULT_LANGUAGE, "chat"),
      channel: "chat",
    },
  ]);

  const turnId = useRef(1);
  const inFlight = useRef<AbortController | null>(null);
  const languageRef = useRef(language);

  const nextId = useCallback(() => `turn-${turnId.current++}`, []);

  useEffect(() => {
    return () => {
      inFlight.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (languageRef.current === language) return;
    languageRef.current = language;
    setMessages((previous) => [
      ...previous,
      {
        id: nextId(),
        role: "agent",
        text: `Switched to ${languageLabel(language)}. Chat, voice and live calls all follow this setting.`,
        channel: "chat",
      },
    ]);
  }, [language, nextId]);

  const speak = useCallback(
    (text: string) => {
      if (!window.speechSynthesis) return;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    },
    [language],
  );

  const sendToAgent = useCallback(
    async (text: string, channel: Channel) => {
      inFlight.current?.abort();
      const controller = new AbortController();
      inFlight.current = controller;

      setMessages((previous) => [...previous, { id: nextId(), role: "user", text, channel }]);
      setThinking(true);

      try {
        const turn = await requestChatTurn(
          { message: text, language, channel },
          controller.signal,
        );

        setMessages((previous) => [
          ...previous,
          {
            id: nextId(),
            role: "agent",
            text: turn.text,
            channel,
            sources: turn.sources,
            toolCall: turn.toolCall,
          },
        ]);

        if (channel === "voice") speak(turn.text);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;

        setMessages((previous) => [
          ...previous,
          {
            id: nextId(),
            role: "agent",
            text:
              error instanceof Error
                ? error.message
                : "Something went wrong reaching the agent.",
            channel,
            error: true,
          },
        ]);
      } finally {
        if (inFlight.current === controller) {
          inFlight.current = null;
          setThinking(false);
        }
      }
    },
    [language, nextId, speak],
  );

  return (
    <>
      <Header
        language={language}
        onLanguageChange={setLanguage}
        voiceEnabled={voiceEnabled}
        onVoiceEnabledChange={setVoiceEnabled}
      />

      <main className="shell">
        <div className="intro">
          <div>
            <h1 className="introTitle">
              Talk to <em>F-Secure Support</em>
            </h1>
            <p className="introText">
              One agent, three ways to reach it. Answers come from the F-Secure knowledge base,
              with breach lookups run as tool calls — identical whether you type, speak, or take a
              call.
            </p>
          </div>
          <div className="channelPills">
            <span className="pill">
              <span className="dot dotSuccess" />
              Chat
            </span>
            <span className="pill">
              <span className={`dot ${voiceEnabled ? "dotSuccess" : ""}`} />
              Voice agent
            </span>
            <span className="pill">
              <span className="dot dotSuccess" />
              Live calls
            </span>
          </div>
        </div>

        <div className="grid">
          <div className="column">
            <ChatPanel
              messages={messages}
              thinking={thinking}
              language={language}
              onSend={(text) => void sendToAgent(text, "chat")}
            />
          </div>

          <div className="column">
            <VoiceAgentPanel
              enabled={voiceEnabled}
              language={language}
              thinking={thinking}
              speaking={speaking}
              onTranscript={(text) => void sendToAgent(text, "voice")}
            />
            <LiveCallPanel />
          </div>
        </div>
      </main>
    </>
  );
}
