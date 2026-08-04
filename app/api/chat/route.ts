import { NextResponse } from "next/server";
import { resolveAgentTurn } from "@/lib/agent/service";
import {
  normalizeAgentTurn,
  parseChatRequest,
  type ApiErrorBody,
  type ChatResponse,
} from "@/lib/api/contracts";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json<ApiErrorBody>({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = parseChatRequest(payload);
  if (typeof parsed === "string") {
    return NextResponse.json<ApiErrorBody>({ error: parsed }, { status: 400 });
  }

  try {
    const turn = await resolveAgentTurn(parsed);
    return NextResponse.json<ChatResponse>(normalizeAgentTurn(turn));
  } catch (error) {
    console.error("[api/chat] agent turn failed", error);
    return NextResponse.json<ApiErrorBody>(
      { error: "The agent is unavailable right now." },
      { status: 502 },
    );
  }
}
