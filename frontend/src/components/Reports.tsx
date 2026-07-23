"use client";

import React from "react";

interface Dataset {
  headers: string[];
  rows: any[][];
  filename: string;
  fileType: string;
}

interface ReportsProps {
  activeDataset: Dataset | null;
}

export default function Reports({ activeDataset }: ReportsProps) {
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto h-full gap-8 bg-transparent select-none print:p-0 print:bg-white print:text-black text-left">
      
      {/* Top Header bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(27,27,27,0.06)", paddingBottom: "20px", marginBottom: "16px" }} className="print:hidden">
        <div>
          <h1 className="text-3xl font-normal text-[#1b1b1b] mb-1">Export Reports</h1>
          <p className="text-zinc-500 text-sm">Compile and print clean summaries of your dataset columns and performance indicators.</p>
        </div>
        
        {activeDataset && (
          <button 
            onClick={triggerPrint} 
            className="btn-primary"
            style={{ fontSize: "12px", borderRadius: "9999px", padding: "10px 20px" }}
          >
            Print Report (PDF)
          </button>
        )}
      </div>

      {!activeDataset ? (
        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyOrigin: "center", justifyContent: "center", textAlign: "center", padding: "48px", border: "1px dashed rgba(27,27,27,0.08)", borderRadius: "16px", maxWidth: "560px", margin: "48px auto", gap: "16px", backgroundColor: "rgba(255, 255, 255, 0.45)", backdropFilter: "blur(12px)", boxShadow: "var(--shadow-soft)", width: "100%" }} className="print:hidden">
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(27,27,27,0.06)", color: "#a1a1aa" }}>
            <svg className="icon-medium" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 2v-6m-9-3h9m0 0l-3-3m3 3l-3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1b1b1b" }}>No Connected Dataset</h3>
            <p style={{ fontSize: "12px", color: "#a1a1aa", marginTop: "4px", maxWidth: "320px", marginLeft: "auto", marginRight: "auto" }}>
              Connect a data source under the <strong>Data Sources</strong> section to compile an exportable report page.
            </p>
          </div>
        </div>
      ) : (
        /* Report Sheet */
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: "64px" }} className="print:pb-0">
          <div style={{ width: "100%", maxWidth: "760px", border: "1px solid rgba(27,27,27,0.08)", borderRadius: "16px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px", backgroundColor: "rgba(255, 255, 255, 0.75)", backdropFilter: "blur(16px)", boxShadow: "var(--shadow-soft)" }} className="print:border-none print:p-0 print:shadow-none print:w-full print:bg-white">
            
            {/* Report Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid rgba(27,27,27,0.06)", paddingBottom: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: "#ac7d58", letterSpacing: "0.05em", marginBottom: "6px" }}>
                  async.ai analytical reports
                </span>
                <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1b1b1b" }} className="serif-text">
                  Dataset Profile Summary
                </h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", textAlign: "right", fontSize: "12px", color: "#a1a1aa" }}>
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Source: {activeDataset.filename}</span>
              </div>
            </div>

            {/* General metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", width: "100%" }}>
              <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(27,27,27,0.06)", backgroundColor: "rgba(255, 255, 255, 0.4)" }}>
                <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: "#a1a1aa", letterSpacing: "0.05em" }}>Connected File</div>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "#1b1b1b", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeDataset.filename}</div>
              </div>
              <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(27,27,27,0.06)", backgroundColor: "rgba(255, 255, 255, 0.4)" }}>
                <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: "#a1a1aa", letterSpacing: "0.05em" }}>Format Type</div>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "#1b1b1b", marginTop: "4px", textTransform: "uppercase" }}>{activeDataset.fileType}</div>
              </div>
              <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid rgba(27,27,27,0.06)", backgroundColor: "rgba(255, 255, 255, 0.4)" }}>
                <div style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: "#a1a1aa", letterSpacing: "0.05em" }}>Parsed Record Length</div>
                <div style={{ fontSize: "12px", fontWeight: "bold", color: "#1b1b1b", marginTop: "4px" }}>{activeDataset.rows.length} records</div>
              </div>
            </div>

            {/* Columns dictionary */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: "#a1a1aa", letterSpacing: "0.05em" }}>
                Data Dictionary ({activeDataset.headers.length} attributes)
              </h3>
              
              <div style={{ border: "1px solid rgba(27,27,27,0.08)", borderRadius: "12px", overflow: "hidden" }}>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr style={{ backgroundColor: "rgba(255, 255, 255, 0.5)", borderBottom: "1px solid rgba(27,27,27,0.08)" }}>
                      <th style={{ padding: "12px", fontSize: "10px", fontWeight: "bold", color: "#5e5e5e", textTransform: "uppercase", letterSpacing: "0.05em" }}>Attribute Column</th>
                      <th style={{ padding: "12px", fontSize: "10px", fontWeight: "bold", color: "#5e5e5e", textTransform: "uppercase", letterSpacing: "0.05em" }}>Data Type Guess</th>
                      <th style={{ padding: "12px", fontSize: "10px", fontWeight: "bold", color: "#5e5e5e", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sample Entry</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeDataset.headers.map((header, idx) => {
                      const sampleCell = activeDataset.rows[0]?.[idx];
                      let typeGuess = "Text";
                      if (sampleCell === null || sampleCell === undefined) typeGuess = "N/A";
                      else if (typeof sampleCell === "number") typeGuess = "Numeric";
                      else if (typeof sampleCell === "boolean") typeGuess = "Boolean";
                      
                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid rgba(27,27,27,0.04)" }}>
                          <td style={{ padding: "12px", fontSize: "12px", fontWeight: "600", color: "#1b1b1b" }}>{header}</td>
                          <td style={{ padding: "12px", fontSize: "12px", color: "#5e5e5e" }}>{typeGuess}</td>
                          <td style={{ padding: "12px", fontSize: "12px", fontFamily: "monospace", color: "#a1a1aa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "200px" }}>
                            {sampleCell === null ? "null" : String(sampleCell)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summaries text block */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
              <h3 style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: "#a1a1aa", letterSpacing: "0.05em" }}>
                Report Notes
              </h3>
              <div style={{ padding: "20px", borderRadius: "12px", border: "1px solid rgba(27, 27, 27, 0.06)", backgroundColor: "rgba(255, 255, 255, 0.45)", fontSize: "12px", color: "#5e5e5e", lineHeight: "1.6" }}>
                This document provides a summary profile of the parsed database source <strong>{activeDataset.filename}</strong>. The columns have been indexed and cleaned for interactive visual graph grids in the <strong>Playground Canvas</strong> workspace and machine learning regressions in the <strong>ML Studio</strong> tool.
              </div>
            </div>
            
            {/* Report footer */}
            <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid rgba(27,27,27,0.06)", display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#a1a1aa" }}>
              <span>async workspace database summaries</span>
              <span>Generated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
