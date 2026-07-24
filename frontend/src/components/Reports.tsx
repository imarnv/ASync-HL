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
    <div className="page-section reports-page flex-1 flex flex-col p-4 sm:p-6 md:p-8 overflow-y-auto h-full gap-6 md:gap-8 bg-transparent select-none print:p-0 print:bg-white print:text-black text-left w-full max-w-full box-border">
      
      <div className="reports-header print:hidden">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-normal text-[#1b1b1b] mb-1">Export Reports</h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            Compile and print clean summaries of your dataset columns and performance indicators.
          </p>
        </div>
        
        {activeDataset && (
          <button 
            onClick={triggerPrint} 
            className="btn-primary reports-print-btn"
            type="button"
          >
            Print Report (PDF)
          </button>
        )}
      </div>

      {!activeDataset ? (
        <div className="reports-empty print:hidden">
          <div className="reports-empty-icon">
            <svg className="icon-medium" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 2v-6m-9-3h9m0 0l-3-3m3 3l-3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-bold text-[#1b1b1b]">No Connected Dataset</h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
              Connect a data source under the <strong>Data Sources</strong> section to compile an exportable report page.
            </p>
          </div>
        </div>
      ) : (
        <div className="reports-sheet-wrap print:pb-0">
          <div className="reports-sheet print:border-none print:p-0 print:shadow-none print:w-full print:bg-white">
            
            <div className="reports-sheet-header">
              <div className="min-w-0">
                <span className="reports-eyebrow">
                  async.ai analytical reports
                </span>
                <h2 className="reports-sheet-title serif-text">
                  Dataset Profile Summary
                </h2>
              </div>
              <div className="reports-meta">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span className="reports-meta-source" title={activeDataset.filename}>
                  Source: {activeDataset.filename}
                </span>
              </div>
            </div>

            <div className="reports-metrics">
              <div className="reports-metric-card">
                <div className="reports-metric-label">Connected File</div>
                <div className="reports-metric-value" title={activeDataset.filename}>
                  {activeDataset.filename}
                </div>
              </div>
              <div className="reports-metric-card">
                <div className="reports-metric-label">Format Type</div>
                <div className="reports-metric-value uppercase">{activeDataset.fileType}</div>
              </div>
              <div className="reports-metric-card">
                <div className="reports-metric-label">Parsed Record Length</div>
                <div className="reports-metric-value">{activeDataset.rows.length} records</div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="reports-section-label">
                Data Dictionary ({activeDataset.headers.length} attributes)
              </h3>
              
              <div className="reports-table-wrap">
                <table className="reports-table">
                  <thead>
                    <tr>
                      <th>Attribute Column</th>
                      <th>Data Type Guess</th>
                      <th>Sample Entry</th>
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
                        <tr key={idx}>
                          <td className="font-semibold text-[#1b1b1b]">{header}</td>
                          <td>{typeGuess}</td>
                          <td className="reports-sample" title={sampleCell === null ? "null" : String(sampleCell)}>
                            {sampleCell === null ? "null" : String(sampleCell)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <h3 className="reports-section-label">Report Notes</h3>
              <div className="reports-notes">
                This document provides a summary profile of the parsed database source <strong>{activeDataset.filename}</strong>.
                {activeDataset.fileType === "pdf" ? (
                  <> PDF files are extracted as plain text into a single <strong>content</strong> field for chat and review.</>
                ) : (
                  <> The columns have been indexed for the <strong>Playground Canvas</strong> and <strong>ML Studio</strong>.</>
                )}
              </div>
            </div>
            
            <div className="reports-footer">
              <span>async workspace database summaries</span>
              <span>Generated: {new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
