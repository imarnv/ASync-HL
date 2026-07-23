"use client";

import React, { useState, useRef } from "react";
import axios from "axios";

interface DataSourcesProps {
  onDatasetLoaded: (data: {
    headers: string[];
    rows: any[][];
    filename: string;
    fileType: string;
  }) => void;
  activeDataset: {
    headers: string[];
    rows: any[][];
    filename: string;
    fileType: string;
  } | null;
}

export default function DataSources({ onDatasetLoaded, activeDataset }: DataSourcesProps) {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filesList, setFilesList] = useState<Array<{ name: string; type: string; rowsCount: number }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const uploadFile = async (file: File) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const parsedData = response.data;
      
      onDatasetLoaded({
        headers: parsedData.headers,
        rows: parsedData.rows,
        filename: file.name,
        fileType: parsedData.file_type,
      });

      const newFileObj = {
        name: file.name,
        type: parsedData.file_type,
        rowsCount: parsedData.rows.length,
      };
      
      setFilesList((prev) => {
        const filtered = prev.filter((f) => f.name !== file.name);
        return [newFileObj, ...filtered];
      });

    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to upload and parse file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  const onButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto h-full gap-8 bg-transparent select-none text-left">
      
      {/* Centered Heading */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <h1 className="text-3xl font-normal text-[#1b1b1b] mb-2">Data Sources</h1>
        <p className="text-zinc-500 text-sm max-w-lg mx-auto leading-relaxed">
          Upload spreadsheets or PDF files to parse metrics and populate the dashboard.
        </p>
      </div>

      <div className="panel-grid max-w-4xl mx-auto w-full">
        {/* Upload Card */}
        <div className="col-6 flex flex-col gap-3">
          <span style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#a1a1aa", letterSpacing: "0.05em" }}>
            Import Document
          </span>
          
          <form
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className="upload-zone"
            style={{
              borderColor: dragActive ? "#ac7d58" : "rgba(27,27,27,0.08)",
              backgroundColor: dragActive ? "rgba(172,125,88,0.04)" : "rgba(255, 255, 255, 0.45)",
              backdropFilter: "blur(12px)",
              boxShadow: "var(--shadow-soft)"
            }}
            onClick={onButtonClick}
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".csv,.xlsx,.xls,.pdf"
              onChange={handleFileChange}
            />
            
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <svg className="animate-spin h-8 w-8 text-[#ac7d58]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span style={{ fontSize: "12px", fontWeight: "600", color: "#1b1b1b" }}>Parsing columns...</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(27,27,27,0.08)" }}>
                  <svg className="icon-medium" style={{ color: "#ac7d58" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <span style={{ fontSize: "13px", fontWeight: "bold", color: "#1b1b1b", display: "block" }}>Drag & Drop files here</span>
                  <span style={{ fontSize: "11px", color: "#a1a1aa", display: "block", marginTop: "4px" }}>CSV, XLSX, XLS, PDF up to 25MB</span>
                </div>
                <button type="button" className="btn-secondary" style={{ padding: "8px 18px", fontSize: "11px", borderRadius: "9999px" }}>
                  Browse Files
                </button>
              </div>
            )}
          </form>

          {error && (
            <div style={{ padding: "12px", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "12px", color: "#ef4444", fontSize: "12px", display: "flex", gap: "8px", alignItems: "center" }}>
              <svg className="icon-small" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Uploaded Datasets List */}
        <div className="col-6 flex flex-col gap-3">
          <span style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#a1a1aa", letterSpacing: "0.05em" }}>
            Connected Files
          </span>
          
          <div className="file-list-container" style={{ backgroundColor: "rgba(255, 255, 255, 0.45)", backdropFilter: "blur(12px)", boxShadow: "var(--shadow-soft)" }}>
            {filesList.length === 0 ? (
              <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", color: "#a1a1aa", gap: "8px" }}>
                <svg className="icon-medium" style={{ opacity: 0.4 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2H6a2 2 0 00-2 2v2m16 4h-3.88l-.512-2H8.392l-.513 2H4" />
                </svg>
                <span style={{ fontSize: "12px" }}>No active connections</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {filesList.map((file, idx) => (
                  <div 
                    key={idx} 
                    style={{
                      padding: "12px",
                      borderRadius: "12px",
                      border: "1px solid",
                      borderColor: activeDataset?.filename === file.name ? "#ac7d58" : "rgba(27,27,27,0.06)",
                      backgroundColor: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      boxShadow: activeDataset?.filename === file.name ? "0 2px 10px rgba(172, 125, 88, 0.05)" : "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", backgroundColor: "#faf6f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {file.type === "pdf" ? (
                          <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: "bold" }}>pdf</span>
                        ) : (
                          <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold" }}>xls</span>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", textAlign: "left" }}>
                        <span style={{ fontSize: "12px", fontWeight: "600", color: "#1b1b1b" }}>{file.name}</span>
                        <span style={{ fontSize: "10px", color: "#a1a1aa" }}>{file.rowsCount} records</span>
                      </div>
                    </div>
                    {activeDataset?.filename === file.name && (
                      <span style={{ fontSize: "9px", padding: "2px 8px", borderRadius: "9999px", backgroundColor: "rgba(172, 125, 88, 0.1)", color: "#ac7d58", fontWeight: "bold" }}>
                        Active
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Spreadsheet / PDF Preview Area */}
      {activeDataset && (
        <div style={{ border: "1px solid rgba(27,27,27,0.06)", borderRadius: "16px", padding: "24px", backgroundColor: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(12px)", width: "100%", maxWidth: "860px", margin: "16px auto 0 auto", boxSizing: "border-box", boxShadow: "var(--shadow-soft)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyOrigin: "space-between", justifyContent: "space-between", borderBottom: "1px solid rgba(27,27,27,0.04)", paddingBottom: "12px", marginBottom: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#a1a1aa", letterSpacing: "0.05em" }}>Spreadsheet Preview</span>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#1b1b1b", marginTop: "2px" }}>{activeDataset.filename}</span>
            </div>
            <span style={{ fontSize: "10px", color: "#a1a1aa" }}>Showing first {Math.min(activeDataset.rows.length, 50)} rows</span>
          </div>

          <div style={{ width: "100%", border: "1px solid rgba(27,27,27,0.06)", borderRadius: "12px", overflowX: "auto", overflowY: "auto", maxHeight: "320px", backgroundColor: "rgba(255, 255, 255, 0.4)" }}>
            {activeDataset.fileType === "pdf" ? (
              <pre style={{ padding: "24px", fontSize: "12px", fontFamily: "monospace", color: "#5e5e5e", whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
                {activeDataset.rows[0]?.[0]}
              </pre>
            ) : (
              <table className="preview-table">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(27,27,27,0.06)" }}>
                    <th style={{ width: "48px", textAlign: "center", color: "#a1a1aa", fontFamily: "monospace", backgroundColor: "rgba(255, 255, 255, 0.4)" }}>#</th>
                    {activeDataset.headers.map((h, i) => (
                      <th key={i} style={{ backgroundColor: "rgba(255, 255, 255, 0.4)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activeDataset.rows.slice(0, 50).map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      <td style={{ width: "48px", textAlign: "center", color: "#a1a1aa", fontFamily: "monospace", fontSize: "11px", borderRight: "1px solid rgba(27,27,27,0.06)", backgroundColor: "rgba(255, 255, 255, 0.3)" }}>
                        {rowIdx + 1}
                      </td>
                      {row.map((cell, cellIdx) => (
                        <td key={cellIdx} className="truncate max-w-xs" title={cell !== null ? String(cell) : ""}>
                          {cell === null ? (
                            <span style={{ color: "#d1d5db", fontStyle: "italic", fontSize: "11px" }}>null</span>
                          ) : (
                            String(cell)
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
