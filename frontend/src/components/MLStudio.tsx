"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { Scatter } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

interface Dataset {
  headers: string[];
  rows: any[][];
  filename: string;
  fileType: string;
}

interface MLStudioProps {
  activeDataset: Dataset | null;
}

interface Point {
  x: number;
  y: number;
}

export default function MLStudio({ activeDataset }: MLStudioProps) {
  const [activeTool, setActiveTool] = useState<"regression" | "kmeans">("regression");
  const [xCol, setXCol] = useState("");
  const [yCol, setYCol] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [regressionResult, setRegressionResult] = useState<{
    slope: number;
    intercept: number;
    r_squared: number;
    trendline: Point[];
  } | null>(null);

  const [kValue, setKValue] = useState(3);
  const [kmeansResult, setKmeansResult] = useState<{
    assignments: number[];
    centroids: Point[];
  } | null>(null);

  useEffect(() => {
    if (activeDataset && activeDataset.headers.length > 0) {
      const numericCols = activeDataset.headers.filter((h) => {
        const colIdx = activeDataset.headers.indexOf(h);
        const sampleVal = Number(activeDataset.rows[0]?.[colIdx]);
        return !isNaN(sampleVal);
      });

      const col1 = numericCols[0] || activeDataset.headers[0];
      const col2 = numericCols[1] || activeDataset.headers[0];
      
      setXCol(col1);
      setYCol(col2);
    }
    setRegressionResult(null);
    setKmeansResult(null);
    setError(null);
  }, [activeDataset]);

  const getCleanPoints = (): Point[] => {
    if (!activeDataset) return [];
    const xIdx = activeDataset.headers.indexOf(xCol);
    const yIdx = activeDataset.headers.indexOf(yCol);
    if (xIdx === -1 || yIdx === -1) return [];

    return activeDataset.rows
      .map((row) => {
        const x = Number(row[xIdx]);
        const y = Number(row[yIdx]);
        return { x, y };
      })
      .filter((p) => !isNaN(p.x) && !isNaN(p.y))
      .slice(0, 100);
  };

  const runRegression = async () => {
    const points = getCleanPoints();
    if (points.length < 2) {
      setError("Need at least 2 numeric data points to calculate regression.");
      return;
    }

    setLoading(true);
    setError(null);
    setKmeansResult(null);

    const xData = points.map((p) => p.x);
    const yData = points.map((p) => p.y);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/ml/regression", {
        x: xData,
        y: yData,
      });
      setRegressionResult(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to execute linear regression model.");
    } finally {
      setLoading(false);
    }
  };

  const runKmeans = async () => {
    const points = getCleanPoints();
    if (points.length < kValue) {
      setError(`Requires at least ${kValue} data points to cluster into ${kValue} groups.`);
      return;
    }

    setLoading(true);
    setError(null);
    setRegressionResult(null);

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/ml/kmeans", {
        points,
        k: kValue,
      });
      setKmeansResult(response.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to execute clustering model.");
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const points = getCleanPoints();
    const datasets: any[] = [];

    if (activeTool === "regression" && regressionResult) {
      datasets.push({
        label: "Data Points",
        data: points,
        backgroundColor: "rgba(27, 27, 27, 0.4)",
        borderColor: "#1b1b1b",
        borderWidth: 1,
        pointRadius: 5,
        type: "scatter" as const,
      });

      datasets.push({
        label: "Regression Line",
        data: regressionResult.trendline,
        type: "line" as const,
        borderColor: "#ac7d58",
        backgroundColor: "transparent",
        borderWidth: 2.5,
        pointRadius: 0,
        fill: false,
        showLine: true,
      });
    } 
    
    else if (activeTool === "kmeans" && kmeansResult) {
      const clustersCount = kValue;
      const colors = ["#ac7d58", "#1b1b1b", "#8a6649", "#5e5e5e", "#dfc5ab", "#8e8e8e"];
      
      for (let c = 0; c < clustersCount; c++) {
        const clusterPoints = points.filter((_, idx) => kmeansResult.assignments[idx] === c);
        datasets.push({
          label: `Cluster ${c + 1}`,
          data: clusterPoints,
          backgroundColor: colors[c % colors.length] + "95",
          borderColor: colors[c % colors.length],
          borderWidth: 1,
          pointRadius: 6,
          type: "scatter" as const,
        });
      }

      datasets.push({
        label: "Centroids",
        data: kmeansResult.centroids,
        backgroundColor: "#ffffff",
        borderColor: "#1b1b1b",
        borderWidth: 2.5,
        pointRadius: 8,
        pointStyle: "rectRot",
        type: "scatter" as const,
      });
    } 
    
    else {
      datasets.push({
        label: "Raw Points",
        data: points,
        backgroundColor: "rgba(27, 27, 27, 0.2)",
        borderColor: "rgba(27, 27, 27, 0.4)",
        borderWidth: 1,
        pointRadius: 5,
        type: "scatter" as const,
      });
    }

    return { datasets };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#5e5e5e",
          font: { family: "Outfit", size: 11 },
        },
      },
      tooltip: {
        backgroundColor: "#ffffff",
        titleColor: "#1b1b1b",
        bodyColor: "#5e5e5e",
        borderColor: "rgba(27, 27, 27, 0.08)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: xCol,
          color: "#5e5e5e",
          font: { family: "Outfit", size: 11, weight: "bold" as const },
        },
        grid: { color: "rgba(27, 27, 27, 0.03)" },
        ticks: { color: "#8e8e8e", font: { family: "Outfit", size: 10 } },
      },
      y: {
        title: {
          display: true,
          text: yCol,
          color: "#5e5e5e",
          font: { family: "Outfit", size: 11, weight: "bold" as const },
        },
        grid: { color: "rgba(27, 27, 27, 0.03)" },
        ticks: { color: "#8e8e8e", font: { family: "Outfit", size: 10 } },
      },
    },
  };

  return (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto h-full gap-8 bg-transparent select-none text-left">
      
      {/* Heading */}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <h1 className="text-3xl font-normal text-[#1b1b1b] mb-1">ML Studio</h1>
        <p className="text-zinc-500 text-sm max-w-lg mx-auto leading-relaxed">
          Execute linear regressions and clustering models to analyze numeric row patterns.
        </p>
      </div>

      {!activeDataset ? (
        <div style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "48px", border: "1px dashed rgba(27,27,27,0.08)", borderRadius: "16px", maxWidth: "560px", margin: "48px auto", gap: "16px", backgroundColor: "rgba(255, 255, 255, 0.45)", backdropFilter: "blur(12px)", boxShadow: "var(--shadow-soft)", width: "100%" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(27,27,27,0.06)", color: "#a1a1aa" }}>
            <svg className="icon-medium" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "bold", color: "#1b1b1b" }}>No Connected Dataset</h3>
            <p style={{ fontSize: "12px", color: "#a1a1aa", marginTop: "4px", maxWidth: "320px", marginLeft: "auto", marginRight: "auto" }}>
              Please upload a spreadsheet under the <strong>Data Sources</strong> section first before launching ML analytics.
            </p>
          </div>
        </div>
      ) : (
        <div className="panel-grid flex-1 min-h-0 w-full">
          
          {/* Settings Left Column */}
          <div className="col-4 flex flex-col gap-5">
            <div style={{ border: "1px solid rgba(27,27,27,0.08)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(12px)", boxShadow: "var(--shadow-soft)" }}>
              
              {/* Tab Selector */}
              <div style={{ display: "flex", backgroundColor: "rgba(27,27,27,0.04)", padding: "4px", borderRadius: "8px", border: "1px solid rgba(27,27,27,0.04)" }}>
                <button
                  onClick={() => {
                    setActiveTool("regression");
                    setError(null);
                  }}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "8px 0",
                    fontSize: "11px",
                    fontWeight: "bold",
                    borderRadius: "6px",
                    border: activeTool === "regression" ? "1px solid rgba(27,27,27,0.08)" : "none",
                    backgroundColor: activeTool === "regression" ? "#ffffff" : "transparent",
                    color: activeTool === "regression" ? "#ac7d58" : "#5e5e5e",
                    cursor: "pointer"
                  }}
                >
                  Regression
                </button>
                <button
                  onClick={() => {
                    setActiveTool("kmeans");
                    setError(null);
                  }}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "8px 0",
                    fontSize: "11px",
                    fontWeight: "bold",
                    borderRadius: "6px",
                    border: activeTool === "kmeans" ? "1px solid rgba(27,27,27,0.08)" : "none",
                    backgroundColor: activeTool === "kmeans" ? "#ffffff" : "transparent",
                    color: activeTool === "kmeans" ? "#ac7d58" : "#5e5e5e",
                    cursor: "pointer"
                  }}
                >
                  K-Means
                </button>
              </div>

              {/* Input Selects */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "bold", color: "#5e5e5e" }}>X-Axis Column</label>
                  <select
                    value={xCol}
                    onChange={(e) => setXCol(e.target.value)}
                    className="custom-select"
                    style={{ width: "100%" }}
                  >
                    {activeDataset.headers.map((h, i) => (
                      <option key={i} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{ fontSize: "11px", fontWeight: "bold", color: "#5e5e5e" }}>Y-Axis Column</label>
                  <select
                    value={yCol}
                    onChange={(e) => setYCol(e.target.value)}
                    className="custom-select"
                    style={{ width: "100%" }}
                  >
                    {activeDataset.headers.map((h, i) => (
                      <option key={i} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {activeTool === "kmeans" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "bold", color: "#5e5e5e" }}>Number of Groups (k)</label>
                    <input
                      type="number"
                      value={kValue}
                      min="2"
                      max="6"
                      onChange={(e) => setKValue(Math.max(2, Math.min(6, parseInt(e.target.value) || 2)))}
                      className="custom-input"
                      style={{ width: "100%" }}
                    />
                  </div>
                )}
              </div>

              {error && (
                <div style={{ padding: "12px", backgroundColor: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "12px", color: "#ef4444", fontSize: "12px" }}>
                  {error}
                </div>
              )}

              <button
                onClick={activeTool === "regression" ? runRegression : runKmeans}
                disabled={loading}
                className="btn-primary"
                style={{ width: "100%", marginTop: "8px", borderRadius: "9999px", padding: "10px 20px" }}
              >
                {loading ? "Computing..." : "Run Analytics Model"}
              </button>
            </div>

            {/* Metrics report */}
            {(regressionResult || kmeansResult) && (
              <div style={{ border: "1px solid rgba(27,27,27,0.08)", borderRadius: "16px", padding: "24px", backgroundColor: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(12px)", boxShadow: "var(--shadow-soft)" }}>
                <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: "#a1a1aa", letterSpacing: "0.05em" }}>Model Report</span>
                
                {activeTool === "regression" && regressionResult && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "12px", marginTop: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(27,27,27,0.04)", paddingBottom: "8px" }}>
                      <span style={{ color: "#5e5e5e" }}>Slope (m)</span>
                      <span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#1b1b1b" }}>{regressionResult.slope.toFixed(4)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(27,27,27,0.04)", paddingBottom: "8px" }}>
                      <span style={{ color: "#5e5e5e" }}>Intercept (c)</span>
                      <span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#1b1b1b" }}>{regressionResult.intercept.toFixed(4)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(27,27,27,0.04)", paddingBottom: "8px" }}>
                      <span style={{ color: "#5e5e5e" }}>R² Coefficient</span>
                      <span style={{ fontFamily: "monospace", fontWeight: "bold", color: "#ac7d58" }}>{regressionResult.r_squared.toFixed(4)}</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "#a1a1aa", lineHeight: "1.5", marginTop: "4px", backgroundColor: "#faf6f0", padding: "10px", borderRadius: "8px", fontFamily: "monospace" }}>
                      Y = {regressionResult.slope.toFixed(3)} * X + {regressionResult.intercept.toFixed(3)}
                    </div>
                  </div>
                )}

                {activeTool === "kmeans" && kmeansResult && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12px", marginTop: "12px" }}>
                    <span style={{ color: "#5e5e5e", fontWeight: "bold" }}>Computed Cluster Centers:</span>
                    {kmeansResult.centroids.map((c, idx) => (
                      <div key={idx} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid rgba(27,27,27,0.04)", paddingBottom: "8px", fontFamily: "monospace" }}>
                        <span style={{ color: "#a1a1aa" }}>Centroid {idx + 1}</span>
                        <span style={{ fontWeight: "bold", color: "#1b1b1b" }}>({c.x.toFixed(2)}, {c.y.toFixed(2)})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Scatter Chart Right Column */}
          <div className="col-8 flex flex-col min-h-[440px]">
            <div style={{ border: "1px solid rgba(27,27,27,0.08)", borderRadius: "16px", padding: "24px", height: "100%", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "rgba(255, 255, 255, 0.65)", backdropFilter: "blur(12px)", boxSizing: "border-box", boxShadow: "var(--shadow-soft)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(27,27,27,0.04)", paddingBottom: "8px" }}>
                <span style={{ fontSize: "9px", fontWeight: "bold", textTransform: "uppercase", color: "#a1a1aa", letterSpacing: "0.05em" }}>Scatter Grouping Chart</span>
                <span style={{ fontSize: "9px", color: "#a1a1aa" }}>Showing first 100 parsed data coordinates</span>
              </div>
              <div style={{ flex: 1, width: "100%", minHeight: "300px", position: "relative", marginTop: "8px" }}>
                <Scatter data={getChartData()} options={chartOptions} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
