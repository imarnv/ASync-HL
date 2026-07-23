"use client";

import React from "react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  datasetName: string | null;
  onKeysClick: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, datasetName, onKeysClick }: SidebarProps) {
  const menuItems = [
    {
      id: "home",
      label: "Home",
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      id: "datasources",
      label: "Data Sources",
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
    },
    {
      id: "playground",
      label: "Playground",
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
    },
    {
      id: "chat",
      label: "Excel Chat",
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      id: "ml",
      label: "ML Studio",
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: "reports",
      label: "Reports",
      icon: (
        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 2v-6m-9-3h9m0 0l-3-3m3 3l-3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="sidebar-layout select-none">
      
      {/* Brand Logo - Centered in navbar with redesigned curve line */}
      <div 
        className="relative cursor-pointer" 
        onClick={() => setActiveTab("home")}
        style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", marginBottom: "36px", marginTop: "8px" }}
      >
        <div style={{ position: "relative", display: "inline-block", paddingBottom: "10px", paddingRight: "48px" }}>
          {/* Brand Text */}
          <span 
            style={{ 
              fontSize: "36px", 
              fontWeight: 300, 
              color: "#1b1b1b", 
              fontFamily: "'Outfit', sans-serif", 
              letterSpacing: "0.5px", 
              lineHeight: "1",
              display: "block"
            }}
          >
            async
          </span>

          {/* Redesigned Bold Continuous Curve Arrow */}
          <svg 
            width="155" 
            height="44" 
            viewBox="0 0 155 44" 
            fill="none" 
            style={{ position: "absolute", left: "-2px", top: "4px", overflow: "visible", pointerEvents: "none" }}
          >
            {/* Continuous Smooth Bold Underline + Upward Turn + Rightward Arrow Extension */}
            <path
              d="M 2 38 L 94 38 C 102 38 106 36 108 28 C 110 18 108 8 118 8 L 148 8"
              stroke="#ac7d58"
              strokeWidth="3.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Matching Bold Arrowhead */}
            <path
              d="M 141 3 L 149 8 L 141 13"
              stroke="#ac7d58"
              strokeWidth="2.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Navigation menu list */}
      <nav className="sidebar-nav">
        <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: "#a1a1aa", letterSpacing: "0.05em", marginBottom: "12px", padding: "0 12px" }}>
          Main Workspace
        </div>
        {menuItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-btn ${isActive ? "sidebar-btn-active" : "sidebar-btn-inactive"}`}
            >
              <span className="sidebar-icon">
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && (
                <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#ac7d58" }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Active dataset display */}
      {datasetName && (
        <div className="sidebar-dataset-box">
          <div style={{ fontSize: "9px", fontWeight: "bold", color: "#a1a1aa", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
            Active Dataset
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "12px" }}>📄</span>
            <span style={{ fontSize: "11px", fontWeight: "600", color: "#1b1b1b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "150px" }} title={datasetName}>
              {datasetName}
            </span>
          </div>
        </div>
      )}

      {/* API credentials & Profile footer */}
      <div className="sidebar-profile">
        <button
          onClick={onKeysClick}
          className="btn-primary"
          style={{ width: "100%", padding: "10px 16px", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: "bold" }}
        >
          API Credentials
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "0 4px", marginTop: "4px" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#ac7d58", display: "flex", alignItems: "center", justifyOrigin: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: "bold", color: "#ffffff" }}>
            U
          </div>
          <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span style={{ fontSize: "12px", fontWeight: "bold", color: "#1b1b1b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Workspace</span>
            <span style={{ fontSize: "10px", color: "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>dev@async.ai</span>
          </div>
        </div>
      </div>

    </div>
  );
}
