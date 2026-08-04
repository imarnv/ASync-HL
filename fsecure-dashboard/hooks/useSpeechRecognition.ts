"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface RecognitionAlternative {
  transcript: string;
}

interface RecognitionResult extends ArrayLike<RecognitionAlternative> {
  isFinal: boolean;
}

interface RecognitionResultEvent {
  results: ArrayLike<RecognitionResult>;
}

interface RecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type RecognitionConstructor = new () => RecognitionLike;

function getRecognitionConstructor(): RecognitionConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const scope = window as unknown as {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition;
}

interface UseSpeechRecognitionOptions {
  language: string;
  /** Keep listening across pauses — used for dictation, not for single questions. */
  continuous?: boolean;
  interimResults?: boolean;
  /** Receives the whole transcript of the current session, not just the last chunk. */
  onTranscript: (transcript: string, isFinal: boolean) => void;
}

/**
 * Shared by the two microphones: dictation in the chat composer and the voice
 * agent panel. They differ only in configuration, so the browser plumbing lives
 * here once.
 */
export function useSpeechRecognition({
  language,
  continuous = false,
  interimResults = false,
  onTranscript,
}: UseSpeechRecognitionOptions) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const callbackRef = useRef(onTranscript);

  useEffect(() => {
    callbackRef.current = onTranscript;
  }, [onTranscript]);

  // Resolved after mount so the server and client render the same markup.
  useEffect(() => {
    setSupported(Boolean(getRecognitionConstructor()));
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setListening(false);
  }, []);

  const start = useCallback(() => {
    const Recognition = getRecognitionConstructor();
    if (!Recognition || recognitionRef.current) return false;

    const recognition = new Recognition();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;

    recognition.onresult = (event) => {
      let transcript = "";
      let isFinal = false;
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index];
        transcript += result[0]?.transcript ?? "";
        if (result.isFinal) isFinal = true;
      }
      callbackRef.current(transcript.trim(), isFinal);
    };
    recognition.onerror = () => {
      recognitionRef.current = null;
      setListening(false);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    return true;
  }, [continuous, interimResults, language]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  return { supported, listening, start, stop };
}
