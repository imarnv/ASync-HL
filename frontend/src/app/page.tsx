"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Home from "../components/Home";
import DataSources from "../components/DataSources";
import DashboardPlayground from "../components/DashboardPlayground";
import ExcelChat from "../components/ExcelChat";
import MLStudio from "../components/MLStudio";
import Reports from "../components/Reports";

interface Dataset {
  headers: string[];
  rows: any[][];
  filename: string;
  fileType: string;
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<string>("home");
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [showKeysModal, setShowKeysModal] = useState<boolean>(false);
  
  // API Keys stored locally in browser
  const [apiKeys, setApiKeys] = useState({
    gemini: "",
    openai: "",
    anthropic: "",
  });

  // Load saved keys from localStorage on mount
  useEffect(() => {
    const savedGemini = localStorage.getItem("async_api_key_gemini") || "";
    const savedOpenai = localStorage.getItem("async_api_key_openai") || "";
    const savedAnthropic = localStorage.getItem("async_api_key_anthropic") || "";
    
    setApiKeys({
      gemini: savedGemini,
      openai: savedOpenai,
      anthropic: savedAnthropic,
    });
  }, []);

  const saveKeys = () => {
    localStorage.setItem("async_api_key_gemini", apiKeys.gemini);
    localStorage.setItem("async_api_key_openai", apiKeys.openai);
    localStorage.setItem("async_api_key_anthropic", apiKeys.anthropic);
    setShowKeysModal(false);
  };

  return (
    <div className="workspace-wrapper">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        datasetName={activeDataset ? activeDataset.filename : null}
        onKeysClick={() => setShowKeysModal(true)}
      />
      
      {/* Main Workspace Canvas */}
      {activeTab === "playground" ? (
        <DashboardPlayground activeDataset={activeDataset} setActiveTab={setActiveTab} />
      ) : (
        <div className="main-canvas">
          {activeTab === "home" && (
            <Home 
              setActiveTab={setActiveTab} 
              datasetLoaded={activeDataset !== null} 
              filename={activeDataset ? activeDataset.filename : null}
            />
          )}
          
          {activeTab === "datasources" && (
            <DataSources 
              onDatasetLoaded={setActiveDataset} 
              activeDataset={activeDataset}
            />
          )}
          
          {activeTab === "chat" && (
            <ExcelChat activeDataset={activeDataset} />
          )}
          
          {activeTab === "ml" && (
            <MLStudio activeDataset={activeDataset} />
          )}
          
          {activeTab === "reports" && (
            <Reports activeDataset={activeDataset} />
          )}
        </div>
      )}

      {/* Global API Keys Configuration Modal */}
      {showKeysModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
          <div className="glass-panel w-full max-w-md p-8 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200 bg-white">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
              <h3 className="text-xl font-bold text-[#1b1b1b]">AI Credentials</h3>
              <button 
                onClick={() => setShowKeysModal(false)}
                className="text-[var(--text-muted)] hover:text-black"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex flex-col gap-5 text-left">
              <p className="text-[var(--text-secondary)] text-xs leading-relaxed">
                Your keys are saved locally in your browser storage (`localStorage`) and are sent securely to proxy queries directly through your backend API.
              </p>

              {/* Gemini key */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">Google Gemini Key</label>
                <input 
                  type="password" 
                  value={apiKeys.gemini}
                  onChange={(e) => setApiKeys({ ...apiKeys, gemini: e.target.value })}
                  placeholder="AIzaSy..."
                  className="custom-input w-full"
                />
              </div>

              {/* OpenAI key */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">OpenAI API Key</label>
                <input 
                  type="password" 
                  value={apiKeys.openai}
                  onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
                  placeholder="sk-proj-..."
                  className="custom-input w-full"
                />
              </div>

              {/* Anthropic key */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)]">Anthropic Claude Key</label>
                <input 
                  type="password" 
                  value={apiKeys.anthropic}
                  onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
                  placeholder="sk-ant-..."
                  className="custom-input w-full"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 border-t border-[var(--color-border)] pt-5">
              <button 
                type="button" 
                onClick={() => setShowKeysModal(false)}
                className="btn-secondary text-xs px-5 py-2.5"
              >
                Close
              </button>
              <button 
                type="button" 
                onClick={saveKeys}
                className="btn-primary text-xs px-5 py-2.5 font-bold"
              >
                Save Credentials
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
