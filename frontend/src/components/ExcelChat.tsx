"use client";

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { marked } from "marked";

interface Dataset {
  headers: string[];
  rows: any[][];
  filename: string;
  fileType: string;
}

interface ExcelChatProps {
  activeDataset: Dataset | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ExcelChat({ activeDataset }: ExcelChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am **async**, your AI data analyst coworker. Select a provider model below, upload a dataset in **Data Sources**, and ask me questions about the variables.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [modelCategory, setModelCategory] = useState("gemini");
  const [modelName, setModelName] = useState("gemini-1.5-flash");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const getDatasetContext = () => {
    if (!activeDataset) return "";
    
    if (activeDataset.fileType === "pdf") {
      const pdfText = activeDataset.rows[0]?.[0] || "";
      return `File Name: ${activeDataset.filename}\nFormat: PDF\nContent Snippet:\n${pdfText.substring(0, 4000)}`;
    }
    
    const headersStr = activeDataset.headers.join(", ");
    const rowsCount = activeDataset.rows.length;
    const sampleRows = activeDataset.rows.slice(0, 5).map((row) => {
      return row.map((cell) => (cell === null ? "null" : String(cell))).join(" | ");
    }).join("\n");
    
    return `File Name: ${activeDataset.filename}
Format: Tabular Spreadsheet (${activeDataset.fileType})
Columns: [${headersStr}]
Total Records (Rows): ${rowsCount}
Sample Data Rows (Headers: ${headersStr}):
${sampleRows}`;
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    let userKey = "";
    if (modelCategory === "gemini") userKey = localStorage.getItem("async_api_key_gemini") || "";
    else if (modelCategory === "gpt") userKey = localStorage.getItem("async_api_key_openai") || "";
    else if (modelCategory === "claude") userKey = localStorage.getItem("async_api_key_anthropic") || "";

    const datasetContext = getDatasetContext();

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/chat", {
        message: userMsg,
        model: modelCategory,
        model_name: modelName,
        api_key: userKey || undefined,
        context: datasetContext || undefined,
      });

      const reply = response.data.reply;
      const errorMsg = response.data.error;

      if (errorMsg) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `⚠️ **Model Error:** ${errorMsg}` },
        ]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      }
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ **System Connection Error:** Failed to connect to the backend server. Please verify the Python API is active." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleModelCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setModelCategory(val);
    if (val === "gemini") setModelName("gemini-1.5-flash");
    else if (val === "gpt") setModelName("gpt-4o-mini");
    else if (val === "claude") setModelName("claude-3-haiku-20240307");
  };

  return (
    <div className="glass-panel flex-1 flex flex-col overflow-hidden select-none text-left" style={{ height: "100%", maxHeight: "640px", backgroundColor: "#ffffff", boxShadow: "var(--shadow-medium)" }}>
      
      {/* Header Panel */}
      <div style={{ borderBottom: "1px solid rgba(172, 125, 88, 0.15)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#ffffff" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#0c0c0e" }} className="serif-text">Excel Chat Workspace</h2>
          <p style={{ color: "#52525b", fontSize: "12px", marginTop: "2px" }}>
            Query spreadsheets, request summaries, or inspect columns via AI.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select 
            value={modelCategory} 
            onChange={handleModelCategoryChange}
            className="custom-select"
            style={{ padding: "8px 14px", fontSize: "11px", borderRadius: "9999px" }}
          >
            <option value="gemini">Google Gemini</option>
            <option value="gpt">OpenAI GPT</option>
            <option value="claude">Anthropic Claude</option>
          </select>

          <select 
            value={modelName} 
            onChange={(e) => setModelName(e.target.value)}
            className="custom-select"
            style={{ padding: "8px 14px", fontSize: "11px", borderRadius: "9999px" }}
          >
            {modelCategory === "gemini" && (
              <>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
              </>
            )}
            {modelCategory === "gpt" && (
              <>
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
              </>
            )}
            {modelCategory === "claude" && (
              <>
                <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
              </>
            )}
          </select>
        </div>
      </div>

      {/* Messages thread */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4" style={{ backgroundColor: "#fafaf9" }}>
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          const rawHtml = marked(msg.content);
          return (
            <div 
              key={index} 
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
              style={{ width: "100%" }}
            >
              {isUser ? (
                <div 
                  className="chat-bubble-user"
                  dangerouslySetInnerHTML={{ __html: rawHtml }}
                />
              ) : (
                <div 
                  className="chat-bubble-ai"
                  dangerouslySetInnerHTML={{ __html: rawHtml }}
                />
              )}
              <span style={{ fontSize: "9px", color: "#8e8e93", marginTop: "4px", padding: "0 6px" }}>
                {isUser ? "You" : `async (${modelName})`}
              </span>
            </div>
          );
        })}
        {loading && (
          <div className="flex flex-col items-start" style={{ width: "100%" }}>
            <div className="chat-bubble-ai flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-[#ac7d58]" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span style={{ fontSize: "12px", color: "#52525b" }}>Compiling context insights...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Dataset Alert */}
      {!activeDataset && (
        <div style={{ margin: "12px 24px", padding: "12px", backgroundColor: "rgba(172, 125, 88, 0.05)", border: "1px solid rgba(172, 125, 88, 0.15)", borderRadius: "12px", color: "#ac7d58", fontSize: "11px", display: "flex", gap: "8px", alignItems: "center" }}>
          <svg className="icon-small" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span style={{ fontWeight: "500" }}>No dataset is active. Connect a file in <strong>Data Sources</strong> to enable data context questions.</span>
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={sendMessage} style={{ padding: "20px 24px", backgroundColor: "#ffffff", borderTop: "1px solid rgba(172, 125, 88, 0.15)", display: "flex", gap: "12px" }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={activeDataset ? `Ask me about ${activeDataset.filename}...` : "Ask me anything..."}
          className="custom-input"
          style={{ flex: 1, borderRadius: "9999px", padding: "12px 20px" }}
        />
        <button 
          type="submit" 
          disabled={!input.trim() || loading}
          className="btn-primary"
          style={{ padding: "10px 24px", borderRadius: "9999px", fontWeight: "bold" }}
        >
          Send
        </button>
      </form>
    </div>
  );
}
