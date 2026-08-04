"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { SUGGESTED_QUESTIONS } from "@/lib/suggestions";
import type { ChatMessage } from "@/lib/types";
import { ArticleIcon, ChatIcon, MicIcon, SendIcon, ToolIcon } from "./Icons";

interface ChatPanelProps {
  messages: ChatMessage[];
  thinking: boolean;
  language: string;
  onSend: (text: string) => void;
}

const COMPOSER_MAX_HEIGHT = 132;

export function ChatPanel({ messages, thinking, language, onSend }: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  /** What was already typed when dictation started, so speech appends to it. */
  const dictationBase = useRef("");

  const handleDictation = useCallback((transcript: string) => {
    const base = dictationBase.current;
    setDraft(base ? `${base} ${transcript}` : transcript);
  }, []);

  const dictation = useSpeechRecognition({
    language,
    continuous: true,
    interimResults: true,
    onTranscript: handleDictation,
  });

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, thinking]);

  /** Grows the composer with its content, and with a placeholder that wraps. */
  useEffect(() => {
    const field = inputRef.current;
    if (!field) return;

    const resize = () => {
      field.style.height = "auto";
      // scrollHeight excludes the border, which border-box sizing counts.
      const border = field.offsetHeight - field.clientHeight;
      field.style.height = `${Math.min(field.scrollHeight + border, COMPOSER_MAX_HEIGHT)}px`;
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [draft]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || thinking) return;
    dictation.stop();
    dictationBase.current = "";
    onSend(trimmed);
    setDraft("");
  }

  function toggleDictation() {
    if (dictation.listening) {
      dictation.stop();
      return;
    }
    dictationBase.current = draft.trim();
    dictation.start();
  }

  return (
    <section className="panel">
      <div className="panelHead">
        <div className="panelTitleWrap">
          <span className="panelIcon">
            <ChatIcon />
          </span>
          <div>
            <div className="panelTitle">Chat</div>
            <div className="panelSub">KB-powered Q&amp;A, in this page</div>
          </div>
        </div>
        <span className="pill">
          <span className="dot dotSuccess" />
          Connected
        </span>
      </div>

      <div className="chatScroll" ref={scrollRef}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`msgRow${message.role === "user" ? " msgRowUser" : ""}`}
          >
            <div
              className={`msg ${message.role === "user" ? "msgUser" : "msgAgent"}${
                message.error ? " msgError" : ""
              }`}
            >
              {message.role === "agent" && (
                <div className="msgMeta">
                  <span>F-Secure agent</span>
                  {message.channel === "voice" && <span>· via voice</span>}
                </div>
              )}

              {message.toolCall && (
                <div className="toolCall">
                  <ToolIcon />
                  {message.toolCall.name}(
                  {Object.entries(message.toolCall.args)
                    .map(([key, value]) => `${key}: "${value}"`)
                    .join(", ")}
                  )
                </div>
              )}

              <div>{message.text}</div>

              {message.sources && message.sources.length > 0 && (
                <div className="sources">
                  {message.sources.map((source) => (
                    <a
                      key={source.id}
                      className="sourceChip"
                      href={source.article.url}
                      target="_blank"
                      rel="noreferrer"
                      title={`${source.title} — ${source.article.title}`}
                    >
                      <ArticleIcon />
                      <span className="sourceChipLabel">{source.title}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="msgRow">
            <div className="msg msgAgent">
              <span className="typing">
                <span />
                <span />
                <span />
              </span>
            </div>
          </div>
        )}
      </div>

      {messages.length <= 1 && (
        <div className="suggestions">
          {SUGGESTED_QUESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              className="suggestion"
              onClick={() => submit(question)}
            >
              {question}
            </button>
          ))}
        </div>
      )}

      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
      >
        <textarea
          ref={inputRef}
          className="field composerInput"
          rows={1}
          placeholder={
            dictation.listening ? "Listening — speak now…" : "Ask about a breach or exposed data…"
          }
          aria-label="Message the F-Secure agent"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit(draft);
            }
          }}
        />
        {dictation.supported && (
          <button
            type="button"
            className={`iconBtn iconBtnGhost${dictation.listening ? " iconBtnRecording" : ""}`}
            aria-label={dictation.listening ? "Stop dictation" : "Dictate your message"}
            aria-pressed={dictation.listening}
            title="Dictate — types what you say. It does not call the voice agent."
            onClick={toggleDictation}
          >
            <MicIcon size={17} />
          </button>
        )}
        <button
          type="submit"
          className="iconBtn"
          aria-label="Send message"
          disabled={!draft.trim() || thinking}
        >
          <SendIcon />
        </button>
      </form>
    </section>
  );
}
