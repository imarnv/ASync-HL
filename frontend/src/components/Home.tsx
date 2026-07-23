"use client";

import React from "react";

interface HomeProps {
  setActiveTab: (tab: string) => void;
  datasetLoaded: boolean;
  filename: string | null;
}

export default function Home({ setActiveTab, datasetLoaded, filename }: HomeProps) {
  return (
    <div className="home-layout">
      
      {/* Small uppercase tag */}
      <span className="text-[10px] uppercase font-bold tracking-widest text-[#ac7d58] mb-6">
        Applied Intelligence Playground
      </span>

      {/* Welcome Title */}
      <h1 className="text-5xl md:text-6xl font-normal leading-[1.15] text-[#1b1b1b] text-center max-w-3xl mb-6">
        Welcome to <span className="text-[#ac7d58] italic font-normal">async</span>
      </h1>

      {/* Subdescription */}
      <p className="text-zinc-500 text-sm md:text-base max-w-2xl text-center leading-relaxed mb-10">
        Your advanced AI data analyst coworker. Upload business spreadsheets (Excel, CSV) or corporate PDFs to instantly preview datasets, design interactive visual dashboard playgrounds, execute regressions, and chat directly with your files using Gemini, GPT, and Claude.
      </p>

      {/* Two centered pill buttons */}
      <div className="buttons-row">
        {datasetLoaded ? (
          <button
            onClick={() => setActiveTab("playground")}
            className="btn-primary"
          >
            See Playground Canvas
          </button>
        ) : (
          <button
            onClick={() => setActiveTab("datasources")}
            className="btn-primary"
          >
            Connect Data Source
          </button>
        )}
        <button
          onClick={() => setActiveTab("chat")}
          className="btn-secondary"
        >
          Ask AI Assistant
        </button>
      </div>

      {/* Four performance columns separated by thin lines */}
      <div className="metrics-row">
        
        {/* Metric 1 */}
        <div className="metric-col">
          <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 mb-2">
            Datasets Parsed
          </span>
          <span className="text-3xl font-normal text-[#1b1b1b] serif-text">
            10,000+
          </span>
        </div>

        {/* Metric 2 */}
        <div className="metric-col">
          <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 mb-2">
            Average Parse Speed
          </span>
          <span className="text-3xl font-normal text-[#1b1b1b] serif-text">
            &lt; 200ms
          </span>
        </div>

        {/* Metric 3 */}
        <div className="metric-col">
          <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 mb-2">
            Analytics Accuracy
          </span>
          <span className="text-3xl font-normal text-[#1b1b1b] serif-text">
            100%
          </span>
        </div>

        {/* Metric 4 */}
        <div className="metric-col">
          <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-400 mb-2">
            AI Models Available
          </span>
          <span className="text-3xl font-normal text-[#1b1b1b] serif-text">
            8+ models
          </span>
        </div>

      </div>

      {/* Loaded Dataset Banner */}
      {datasetLoaded && filename && (
        <div className="mt-12 p-3 bg-zinc-50 border border-zinc-200/60 rounded-full flex items-center gap-3 px-5 text-xs text-zinc-600">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Active dataset: <strong>{filename}</strong></span>
        </div>
      )}

    </div>
  );
}
