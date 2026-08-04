"use client";

import { useEffect, useRef, useState } from "react";
import type { CallRecord, CallStatus } from "@/lib/types";
import { PhoneIcon, PhoneOffIcon } from "./Icons";

const RECENT_CALLS: CallRecord[] = [
  {
    id: "call-1",
    phone: "+358 40 555 0142",
    direction: "inbound",
    durationSeconds: 264,
    topic: "Breach source not named in report",
    outcome: "resolved",
  },
  {
    id: "call-2",
    phone: "+46 70 555 0198",
    direction: "outbound",
    durationSeconds: 431,
    topic: "Password reuse after combo list exposure",
    outcome: "escalated",
  },
  {
    id: "call-3",
    phone: "+45 31 555 0107",
    direction: "inbound",
    durationSeconds: 0,
    topic: "Missed — no answer",
    outcome: "missed",
  },
];

const OUTCOME_DOT: Record<CallRecord["outcome"], string> = {
  resolved: "dotSuccess",
  escalated: "dotWarning",
  missed: "dotError",
};

function formatDuration(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function LiveCallPanel() {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [phone, setPhone] = useState("");
  const [seconds, setSeconds] = useState(0);
  const dialTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status !== "connected") return;
    const interval = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    return () => {
      if (dialTimer.current) clearTimeout(dialTimer.current);
    };
  }, []);

  function requestCallback() {
    if (!phone.trim()) return;
    setSeconds(0);
    setStatus("dialing");
    dialTimer.current = setTimeout(() => setStatus("connected"), 2200);
  }

  function endCall() {
    if (dialTimer.current) clearTimeout(dialTimer.current);
    setStatus("ended");
  }

  const live = status === "dialing" || status === "connected";

  return (
    <section className="panel">
      <div className="panelHead">
        <div className="panelTitleWrap">
          <span className="panelIcon">
            <PhoneIcon />
          </span>
          <div>
            <div className="panelTitle">Live calls</div>
            <div className="panelSub">Telephony — runs outside this page</div>
          </div>
        </div>
        <span className="pill">
          <span className={`dot ${live ? "dotLive" : ""}`} />
          {live ? "In call" : "No active call"}
        </span>
      </div>

      <div className="panelBody">
        {live ? (
          <>
            <div className="callActive">
              <span className="dot dotLive" />
              <div className="callItemMain">
                <div className="callItemTitle">{phone}</div>
                <div className="callItemMeta">
                  {status === "dialing" ? "Dialing…" : "Connected to F-Secure agent"}
                </div>
              </div>
              {status === "connected" && (
                <span className="callTimer">{formatDuration(seconds)}</span>
              )}
            </div>
            <button type="button" className="btn btnDanger btnFull" onClick={endCall}>
              <PhoneOffIcon />
              End call
            </button>
          </>
        ) : (
          <div className="callForm">
            <div>
              <label className="label" htmlFor="callback-phone">
                Phone number
              </label>
              <input
                id="callback-phone"
                className="field"
                type="tel"
                inputMode="tel"
                placeholder="+358 40 123 4567"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btnPrimary btnFull"
              disabled={!phone.trim()}
              onClick={requestCallback}
            >
              <PhoneIcon />
              Request a callback
            </button>
            <p className="hint" style={{ margin: 0 }}>
              {status === "ended"
                ? "Call ended. The transcript will appear below once processing finishes."
                : "The agent calls you back and answers from the same knowledge base as chat."}
            </p>
          </div>
        )}

        <ul className="callList">
          <li className="sectionLabel">Recent calls</li>
          {RECENT_CALLS.map((call) => (
            <li key={call.id} className="callItem">
              <span className={`dot ${OUTCOME_DOT[call.outcome]}`} />
              <div className="callItemMain">
                <div className="callItemTitle">{call.topic}</div>
                <div className="callItemMeta">
                  {call.phone} · {call.direction}
                  {call.durationSeconds > 0 && ` · ${formatDuration(call.durationSeconds)}`}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
