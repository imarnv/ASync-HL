"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar, Pie, Scatter } from "react-chartjs-2";
import axios from "axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Dataset {
  headers: string[];
  rows: any[][];
  filename: string;
  fileType: string;
}

interface Widget {
  id: string;
  title: string;
  type: "kpi" | "line" | "bar" | "pie" | "area" | "scatter" | "gauge" | "funnel" | "map" | "data";
  xCol: string;
  yCol: string;
  kpiCol?: string;
  kpiOp?: "sum" | "mean" | "count";
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  time?: string;
}

interface DashboardPlaygroundProps {
  activeDataset: Dataset | null;
  setActiveTab: (tab: string) => void;
}

export default function DashboardPlayground({ activeDataset, setActiveTab }: DashboardPlaygroundProps) {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [backgroundStyle, setBackgroundStyle] = useState<"dots" | "grid" | "blank">("dots");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [showChartsMenu, setShowChartsMenu] = useState<boolean>(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Floating Chatbot popup state
  const [showChatbot, setShowChatbot] = useState<boolean>(false);
  const [chatbotPosition, setChatbotPosition] = useState({ x: 680, y: 100 });
  const [chatbotSize, setChatbotSize] = useState({ width: 360, height: 460 });
  const [chatbotZIndex, setChatbotZIndex] = useState<number>(30);
  const [chatbotMessages, setChatbotMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! How can I help you today?",
      time: "04:58 PM"
    },
    {
      role: "assistant",
      content: "I can provide insights into your data, generate insights or answer questions about these charts.",
      time: "04:58 PM"
    }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Drag & Resize tracking
  const [dragInfo, setDragInfo] = useState<{
    id: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const [resizeInfo, setResizeInfo] = useState<{
    id: string;
    startX: number;
    startY: number;
    origWidth: number;
    origHeight: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const chatbotMessagesEndRef = useRef<HTMLDivElement>(null);

  // Load saved widgets if available, but do NOT auto-populate charts by default
  useEffect(() => {
    if (!activeDataset) {
      setWidgets([]);
      return;
    }

    const saved = localStorage.getItem(`async_playground_widgets_${activeDataset.filename}`);
    const savedBg = localStorage.getItem(`async_playground_bg_${activeDataset.filename}`);
    const savedZoom = localStorage.getItem(`async_playground_zoom_${activeDataset.filename}`);

    if (savedBg) setBackgroundStyle(savedBg as any);
    if (savedZoom) setZoomLevel(Number(savedZoom));

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setWidgets(parsed);
          return;
        }
      } catch (e) {
        console.error("Error parsing saved widgets", e);
      }
    }

    // Start with empty widgets list so user can choose manually
    setWidgets([]);
  }, [activeDataset]);

  useEffect(() => {
    chatbotMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatbotMessages]);

  const handleSave = () => {
    if (!activeDataset) return;
    localStorage.setItem(`async_playground_widgets_${activeDataset.filename}`, JSON.stringify(widgets));
    localStorage.setItem(`async_playground_bg_${activeDataset.filename}`, backgroundStyle);
    localStorage.setItem(`async_playground_zoom_${activeDataset.filename}`, String(zoomLevel));
    
    setSaveSuccessMessage("Saved!");
    setTimeout(() => setSaveSuccessMessage(null), 2500);
  };

  const bringToFront = (id: string) => {
    if (id === "chatbot") {
      setChatbotZIndex(prev => {
        const maxZ = Math.max(...widgets.map(w => w.zIndex || 1), prev);
        return maxZ + 1;
      });
    } else {
      setWidgets(prev => {
        const maxZ = Math.max(...prev.map(w => w.zIndex || 1), chatbotZIndex);
        return prev.map(w => {
          if (w.id === id) {
            return { ...w, zIndex: maxZ + 1 };
          }
          return w;
        });
      });
    }
  };

  const startDrag = (e: React.MouseEvent, id: string, origX: number, origY: number) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input') || target.closest('.widget-controls') || target.closest('.resize-handle')) {
      return;
    }
    e.preventDefault();
    setDragInfo({ id, startX: e.clientX, startY: e.clientY, origX, origY });
    bringToFront(id);
  };

  const startResize = (e: React.MouseEvent, id: string, origWidth: number, origHeight: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizeInfo({ id, startX: e.clientX, startY: e.clientY, origWidth, origHeight });
    bringToFront(id);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const scale = zoomLevel / 100;
    
    if (dragInfo) {
      const dx = (e.clientX - dragInfo.startX) / scale;
      const dy = (e.clientY - dragInfo.startY) / scale;
      const newX = Math.max(0, dragInfo.origX + dx);
      const newY = Math.max(0, dragInfo.origY + dy);

      if (dragInfo.id === "chatbot") {
        setChatbotPosition({ x: newX, y: newY });
      } else {
        setWidgets(prev => prev.map(w => (w.id === dragInfo.id ? { ...w, x: newX, y: newY } : w)));
      }
    } else if (resizeInfo) {
      const dx = (e.clientX - resizeInfo.startX) / scale;
      const dy = (e.clientY - resizeInfo.startY) / scale;
      const newW = Math.max(220, resizeInfo.origWidth + dx);
      const newH = Math.max(180, resizeInfo.origHeight + dy);

      if (resizeInfo.id === "chatbot") {
        setChatbotSize({ width: Math.max(280, newW), height: Math.max(300, newH) });
      } else {
        setWidgets(prev => prev.map(w => (w.id === resizeInfo.id ? { ...w, width: newW, height: newH } : w)));
      }
    }
  };

  const onMouseUp = () => {
    setDragInfo(null);
    setResizeInfo(null);
  };

  // Add ONLY the selected chart type onto the canvas
  const addWidgetFromToolbar = (type: Widget["type"]) => {
    if (!activeDataset) return;
    const id = Math.random().toString(36).substring(7);
    const headers = activeDataset.headers;

    // Grid placement calculation
    const count = widgets.length;
    const col = count % 3;
    const row = Math.floor(count / 3);
    const x = 60 + col * 460;
    const y = 60 + row * 320;
    
    // Auto-detect columns
    let xCol = headers[0];
    let yCol = headers[1] || headers[0];
    
    const numericCols = headers.filter(h => {
      const samples = activeDataset.rows.slice(0, 10).map(r => r[headers.indexOf(h)]);
      return samples.filter(v => v !== null && !isNaN(Number(v))).length > 5;
    });

    if (numericCols.length > 0) {
      yCol = numericCols[0];
      const nonNum = headers.find(h => !numericCols.includes(h));
      if (nonNum) xCol = nonNum;
    }

    const titleMap: Record<string, string> = {
      bar: "Bar Analysis",
      line: "Line Chart",
      area: "Area Trend",
      pie: "Distribution Pie",
      scatter: "Correlation Scatter",
      gauge: "Performance Gauge",
      funnel: "Funnel Conversion",
      map: "Geographic Map",
      kpi: "Summary KPI",
      data: "Data Ledger"
    };

    const colorMap: Record<string, string> = {
      bar: "#ac7d58",
      line: "#8b5cf6",
      area: "#2563eb",
      pie: "#dfc5ab",
      scatter: "#ec4899",
      gauge: "#10b981",
      funnel: "#f59e0b",
      map: "#06b6d4",
      kpi: "#6366f1",
      data: "#64748b"
    };

    const newWidget: Widget = {
      id,
      title: titleMap[type] || `${type.toUpperCase()} Widget`,
      type,
      xCol,
      yCol,
      kpiCol: yCol,
      kpiOp: "sum",
      color: colorMap[type] || "#2563eb",
      x,
      y,
      width: type === "kpi" || type === "gauge" ? 280 : 440,
      height: type === "kpi" || type === "gauge" ? 260 : 290,
      zIndex: Math.max(...widgets.map(w => w.zIndex || 1), chatbotZIndex, 2) + 1
    };

    setWidgets(prev => [...prev, newWidget]);
    setShowChartsMenu(false);
  };

  const removeWidget = (id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  const updateWidgetConfig = (id: string, updates: Partial<Widget>) => {
    setWidgets(prev => prev.map(w => (w.id === id ? { ...w, ...updates } : w)));
  };

  const getColumnData = (colName: string) => {
    if (!activeDataset) return [];
    const idx = activeDataset.headers.indexOf(colName);
    if (idx === -1) return [];
    return activeDataset.rows.map(r => r[idx]);
  };

  const getNumericColumnData = (colName: string) => {
    return getColumnData(colName).map(v => Number(v)).filter(v => !isNaN(v));
  };

  const getChartData = (widget: Widget) => {
    if (!activeDataset) return { labels: [], datasets: [] };

    const xIdx = activeDataset.headers.indexOf(widget.xCol);
    const yIdx = activeDataset.headers.indexOf(widget.yCol);

    if (xIdx === -1 || yIdx === -1) return { labels: [], datasets: [] };

    const limit = 25;
    const sliced = activeDataset.rows.slice(0, limit);
    const labels = sliced.map(r => String(r[xIdx]));
    const isArea = widget.type === "area";

    if (widget.type === "scatter") {
      const data = sliced.map(r => ({
        x: Number(r[xIdx]) || 0,
        y: Number(r[yIdx]) || 0
      }));
      return {
        datasets: [{
          label: `${widget.yCol} vs ${widget.xCol}`,
          data,
          backgroundColor: widget.color,
          pointRadius: 5
        }]
      };
    }

    const data = sliced.map(r => {
      const val = Number(r[yIdx]);
      return isNaN(val) ? 0 : val;
    });

    return {
      labels,
      datasets: [
        {
          label: widget.yCol,
          data,
          borderColor: widget.color,
          backgroundColor: isArea
            ? `${widget.color}20`
            : widget.type === "pie"
              ? ["#ac7d58", "#1b1b1b", "#b98a60", "#e2d2c2", "#dfc5ab", "#8f8f8f", "#10b981", "#0ea5e9"].slice(0, labels.length)
              : widget.color,
          borderWidth: 2,
          fill: isArea,
          tension: 0.35,
          pointBackgroundColor: widget.color,
          pointBorderColor: "#fff",
          pointHoverRadius: 5,
        },
      ],
    };
  };

  const getChartOptions = (widget: Widget) => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#ffffff",
          titleColor: "#1b1b1b",
          bodyColor: "#5e5e5e",
          borderColor: "rgba(27, 27, 27, 0.08)",
          borderWidth: 1,
        },
      },
      scales: (widget.type !== "pie" && widget.type !== "scatter") ? {
        x: { grid: { color: "rgba(27, 27, 27, 0.03)" }, ticks: { color: "#8e8e8e", font: { size: 9 } } },
        y: { grid: { color: "rgba(27, 27, 27, 0.03)" }, ticks: { color: "#8e8e8e", font: { size: 9 } } },
      } : widget.type === "scatter" ? {
        x: { type: "linear" as const, position: "bottom" as const, grid: { color: "rgba(27, 27, 27, 0.03)" }, ticks: { color: "#8e8e8e", font: { size: 9 } } },
        y: { grid: { color: "rgba(27, 27, 27, 0.03)" }, ticks: { color: "#8e8e8e", font: { size: 9 } } }
      } : undefined,
    };
  };

  const renderKpiValue = (widget: Widget) => {
    if (!activeDataset || !widget.kpiCol) return "N/A";
    const values = getNumericColumnData(widget.kpiCol);

    if (widget.kpiOp === "count") {
      return activeDataset.rows.length.toLocaleString();
    }
    if (values.length === 0) return "0";

    const sum = values.reduce((acc, v) => acc + v, 0);
    if (widget.kpiOp === "sum") {
      return sum.toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    if (widget.kpiOp === "mean") {
      return (sum / values.length).toLocaleString(undefined, { maximumFractionDigits: 2 });
    }
    return "0";
  };

  // Custom SVG Gauge Component
  const SvgGauge = ({ widget }: { widget: Widget }) => {
    const numData = getNumericColumnData(widget.yCol);
    const avg = numData.length > 0 ? numData.reduce((acc, v) => acc + v, 0) / numData.length : 100;
    const maxVal = Math.max(...numData) || 100;
    const ratio = Math.min(100, Math.max(0, Math.round((avg / maxVal) * 100)));
    
    const radius = 48;
    const strokeWidth = 10;
    const circumference = Math.PI * radius;
    const strokeDashoffset = circumference - (ratio / 100) * circumference;

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", height: "100%", textAlign: "center" }}>
        <div style={{ width: 140, height: 80, position: "relative" }}>
          <svg viewBox="0 0 120 70" style={{ width: "100%", height: "100%" }}>
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="rgba(229, 231, 235, 0.8)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            <path
              d="M 10 60 A 50 50 0 0 1 110 60"
              fill="none"
              stroke="#10b981"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{ transition: "stroke-dashoffset 0.8s ease" }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", paddingBottom: 6 }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: "#1b1b1b" }}>
              {ratio}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  const FunnelChart = ({ widget }: { widget: Widget }) => {
    const catData = getColumnData(widget.xCol).map(v => String(v));
    const numData = getColumnData(widget.yCol).map(v => Number(v) || 0);

    const aggregates: Record<string, number> = {};
    catData.forEach((cat, idx) => {
      if (!cat || cat === "null") return;
      aggregates[cat] = (aggregates[cat] || 0) + numData[idx];
    });

    const sortedStages = Object.entries(aggregates)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    if (sortedStages.length === 0) {
      return <div style={{ fontSize: 11, color: "#a1a1aa" }}>No Funnel Data</div>;
    }

    const maxVal = sortedStages[0].value || 1;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%", height: "100%", justifyContent: "center", padding: "8px" }}>
        {sortedStages.map((step, idx) => {
          const widthPercent = Math.max(35, Math.round((step.value / maxVal) * 100));
          return (
            <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
              <div 
                style={{ 
                  width: `${widthPercent}%`, 
                  backgroundColor: widget.color, 
                  opacity: 1 - (idx * 0.15),
                  height: "26px",
                  borderRadius: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 10px",
                }}
              >
                <span style={{ fontSize: "10px", color: "#ffffff", fontWeight: 700 }}>{step.label}</span>
                <span style={{ fontSize: "10px", color: "#ffffff", fontWeight: 700 }}>{step.value.toLocaleString()}</span>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const MapChart = ({ widget }: { widget: Widget }) => {
    const catData = Array.from(new Set(getColumnData(widget.xCol).map(v => String(v)))).slice(0, 5);
    const numData = getNumericColumnData(widget.yCol);
    const maxVal = Math.max(...numData) || 100;

    const coordinates = [
      { x: 45, y: 35 },
      { x: 105, y: 32 },
      { x: 160, y: 42 },
      { x: 65, y: 78 },
      { x: 108, y: 62 },
    ];

    return (
      <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f4f4f5", borderRadius: "12px", overflow: "hidden" }}>
        <svg viewBox="0 0 220 120" style={{ width: "100%", height: "100%", opacity: 0.35 }}>
          <path d="M 25 20 C 30 15, 60 20, 55 45 C 50 50, 45 40, 25 20 Z" fill="#ac7d58" />
          <path d="M 50 55 C 60 65, 70 85, 60 95 C 55 85, 45 65, 50 55 Z" fill="#ac7d58" />
          <path d="M 90 48 C 110 48, 120 60, 110 80 C 105 85, 95 70, 90 48 Z" fill="#ac7d58" />
          <path d="M 85 25 C 100 20, 110 30, 95 38 C 90 35, 85 30, 85 25 Z" fill="#ac7d58" />
          <path d="M 120 20 C 160 15, 180 35, 175 60 C 160 65, 140 45, 120 20 Z" fill="#ac7d58" />
        </svg>

        {catData.map((label, idx) => {
          const coord = coordinates[idx] || { x: 50 + idx * 25, y: 50 };
          const val = numData[idx] || (maxVal * 0.5);
          const ratio = val / maxVal;
          const markerSize = Math.max(8, Math.min(18, 8 + ratio * 10));

          return (
            <div 
              key={idx}
              style={{ position: "absolute", left: `${(coord.x / 220) * 100}%`, top: `${(coord.y / 120) * 100}%`, transform: "translate(-50%, -50%)" }}
            >
              <div style={{ width: markerSize, height: markerSize, borderRadius: "50%", backgroundColor: "#06b6d4", border: "2px solid #ffffff", boxShadow: "0 2px 6px rgba(0,0,0,0.15)" }} title={`${label}: ${val}`} />
            </div>
          );
        })}
      </div>
    );
  };

  const LedgerGrid = ({ widget }: { widget: Widget }) => {
    if (!activeDataset) return null;
    const col1Idx = activeDataset.headers.indexOf(widget.xCol);
    const col2Idx = activeDataset.headers.indexOf(widget.yCol);
    if (col1Idx === -1 || col2Idx === -1) return <div style={{ fontSize: 11, color: "#a1a1aa" }}>Invalid Columns</div>;

    return (
      <div style={{ width: "100%", height: "100%", overflow: "auto", backgroundColor: "#ffffff", borderRadius: 8, border: "1px solid #f4f4f5" }}>
        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "#fafafa", borderBottom: "1px solid #e4e4e7" }}>
              <th style={{ padding: 6, fontWeight: 700, color: "#71717a", fontSize: 9, textTransform: "uppercase" }}>{widget.xCol}</th>
              <th style={{ padding: 6, fontWeight: 700, color: "#71717a", fontSize: 9, textTransform: "uppercase" }}>{widget.yCol}</th>
            </tr>
          </thead>
          <tbody>
            {activeDataset.rows.slice(0, 30).map((row, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid #f4f4f5" }}>
                <td style={{ padding: 6, color: "#3f3f46" }}>{row[col1Idx] === null ? "null" : String(row[col1Idx])}</td>
                <td style={{ padding: 6, color: "#52525b", fontFamily: "monospace" }}>{row[col2Idx] === null ? "null" : String(row[col2Idx])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Chatbot backend message dispatcher
  const sendChatMessage = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || chatLoading) return;

    if (!customText) setChatInput("");
    
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    setChatbotMessages(prev => [...prev, { role: "user", content: textToSend, time: timeStr }]);
    setChatLoading(true);

    const key = localStorage.getItem("async_api_key_gemini") || "";
    const activeCharts = widgets.map((w, i) => `Chart ${i + 1}: ${w.title} (${w.type})`).join(", ");
    const context = activeDataset ? `Dataset: ${activeDataset.filename}, Columns: ${activeDataset.headers.join(", ")}. Charts on screen: ${activeCharts}` : "";

    try {
      const response = await axios.post("http://127.0.0.1:8000/api/chat", {
        message: textToSend,
        model: "gemini",
        model_name: "gemini-1.5-flash",
        api_key: key || undefined,
        context: context || undefined,
      });

      const reply = response.data.reply;
      const errorMsg = response.data.error;

      if (errorMsg) {
        setChatbotMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${errorMsg}`, time: timeStr }]);
      } else {
        setChatbotMessages(prev => [...prev, { role: "assistant", content: reply, time: timeStr }]);
      }
    } catch (err: any) {
      setChatbotMessages(prev => [
        ...prev,
        { role: "assistant", content: "I can provide insights into your data, generate insights or answer questions about these charts.", time: timeStr }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const triggerExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(widgets, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `async-dashboard-${activeDataset?.filename || 'export'}.json`);
    dlAnchorElem.click();
  };

  return (
    <div 
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        width: "100%",
        backgroundColor: "#f7f5f0",
        overflow: "hidden",
        position: "relative",
        userSelect: "none"
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
    >
      
      {/* 1. TOP NAVBAR */}
      <div 
        style={{
          height: "52px",
          width: "100%",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid rgba(27, 27, 27, 0.08)",
          padding: "0 20px",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          boxSizing: "border-box",
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        {/* Left Side: Back & Title */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <button 
            onClick={() => setActiveTab("home")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#52525b",
              fontSize: "13px",
              fontWeight: 500
            }}
          >
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span>Back</span>
          </button>

          <span style={{ fontSize: "14px", fontWeight: 600, color: "#0c0c0e", letterSpacing: "-0.01em" }}>
            Dashboard Playground
          </span>
        </div>

        {/* Right Side: Toolbar buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          
          {saveSuccessMessage && (
            <span style={{ fontSize: "11px", color: "#16a34a", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 8px", borderRadius: "12px", fontWeight: 600 }}>
              {saveSuccessMessage}
            </span>
          )}

          {/* Grid Selector */}
          <button
            onClick={() => {
              setBackgroundStyle(prev => (prev === "dots" ? "grid" : prev === "grid" ? "blank" : "dots"));
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "16px",
              padding: "5px 12px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <svg style={{ width: 13, height: 13 }} fill="currentColor" viewBox="0 0 20 20">
              <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span>{backgroundStyle === "dots" ? "Grid" : backgroundStyle === "grid" ? "Lines" : "Blank"}</span>
          </button>

          {/* Zoom controls */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#52525b" }}>
            <button onClick={() => setZoomLevel(prev => Math.max(50, prev - 10))} style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a", padding: "2px" }}>
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
              </svg>
            </button>
            <span style={{ fontFamily: "monospace", fontSize: "12px", color: "#27272a", width: "36px", textAlign: "center" }}>{zoomLevel}%</span>
            <button onClick={() => setZoomLevel(prev => Math.min(150, prev + 10))} style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a", padding: "2px" }}>
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
              </svg>
            </button>
          </div>

          {/* Reset button */}
          <button onClick={() => setWidgets([])} style={{ background: "none", border: "none", cursor: "pointer", color: "#71717a", padding: "4px" }} title="Clear canvas">
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
            </svg>
          </button>

          {/* Move to Reports */}
          <button 
            onClick={() => setActiveTab("reports")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "12px",
              color: "#3f3f46",
              fontWeight: 500,
              padding: "4px 8px"
            }}
          >
            <svg style={{ width: 14, height: 14, color: "#71717a" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0-10.628a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5zm0 10.628a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
            </svg>
            <span>Move to Reports</span>
          </button>

          {/* Preview */}
          <button 
            onClick={() => setPreviewMode(!previewMode)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: previewMode ? "#2563eb" : "transparent",
              color: previewMode ? "#ffffff" : "#3f3f46",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 500,
              padding: "4px 10px"
            }}
          >
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Preview</span>
          </button>

          {/* Export */}
          <button 
            onClick={triggerExport}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#ffffff",
              border: "1px solid #e4e4e7",
              borderRadius: "14px",
              cursor: "pointer",
              fontSize: "12px",
              color: "#3f3f46",
              fontWeight: 500,
              padding: "5px 12px"
            }}
          >
            <svg style={{ width: 14, height: 14, color: "#71717a" }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            <span>Export</span>
          </button>

          {/* Save Button */}
          <button 
            onClick={handleSave}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "16px",
              padding: "5px 16px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* 2. DOTTED CANVAS AREA */}
      <div 
        style={{
          flex: 1,
          overflow: "auto",
          position: "relative",
          width: "100%",
          backgroundColor: "#f7f5f0",
          ...((backgroundStyle === "dots" && {
            backgroundImage: "radial-gradient(rgba(27, 27, 27, 0.15) 1.2px, transparent 1.2px)",
            backgroundSize: "20px 20px"
          }) || (backgroundStyle === "grid" && {
            backgroundImage: "linear-gradient(rgba(27, 27, 27, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(27, 27, 27, 0.05) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }) || {})
        }}
        ref={canvasRef}
      >
        <div 
          style={{
            width: "2400px",
            height: "1400px",
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top left",
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          
          {/* Empty state message when no widgets on canvas */}
          {widgets.length === 0 && (
            <div style={{ position: "absolute", top: "140px", left: "calc(50vw - 240px)", width: "480px" }}>
              <div style={{ backgroundColor: "#ffffff", borderRadius: "20px", border: "1px solid #e4e4e7", padding: "36px", textAlign: "center", boxShadow: "0 10px 25px rgba(0,0,0,0.04)", display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                <div style={{ width: 48, height: 48, borderRadius: "14px", backgroundColor: "#f4f4f5", display: "flex", alignItems: "center", justifyContent: "center", color: "#a1a1aa" }}>
                  <svg style={{ width: 24, height: 24 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#18181b" }}>Start building your report</h3>
                  <p style={{ fontSize: "12px", color: "#71717a", marginTop: "6px", lineHeight: "1.5" }}>
                    Click the <strong style={{ color: "#2563eb" }}>+</strong> or <strong style={{ color: "#2563eb" }}>Sparkles</strong> icon on the bottom toolbar to choose your desired chart or graph widget.
                  </p>
                </div>
                <button 
                  onClick={() => setShowChartsMenu(true)}
                  style={{ backgroundColor: "#2563eb", color: "#ffffff", border: "none", borderRadius: "14px", padding: "10px 22px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}
                >
                  Choose a Chart / Widget
                </button>
              </div>
            </div>
          )}

          {/* RENDERED WIDGET CARDS */}
          {widgets.map((widget) => {
            const isEditing = editingWidgetId === widget.id;
            
            return (
              <div 
                key={widget.id} 
                style={{
                  position: "absolute",
                  left: `${widget.x}px`,
                  top: `${widget.y}px`,
                  width: `${widget.width}px`,
                  height: `${widget.height}px`,
                  zIndex: widget.zIndex || 2,
                  backgroundColor: "#ffffff",
                  borderRadius: "20px",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
                  border: "1px solid rgba(27, 27, 27, 0.08)",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden"
                }}
              >
                {/* Header bar */}
                <div 
                  onMouseDown={(e) => startDrag(e, widget.id, widget.x, widget.y)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px 18px 8px 18px",
                    cursor: "move",
                    userSelect: "none"
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "9px", textTransform: "uppercase", fontWeight: 700, color: "#a1a1aa", letterSpacing: "0.08em" }}>{widget.type.toUpperCase()}</span>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#18181b" }}>{widget.title}</span>
                    {activeDataset && <span style={{ fontSize: "10px", color: "#a1a1aa" }}>{activeDataset.filename}</span>}
                  </div>

                  {!previewMode && (
                    <div className="widget-controls" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <button 
                        onClick={() => setEditingWidgetId(isEditing ? null : widget.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#a1a1aa", padding: "4px" }}
                        title="Edit columns"
                      >
                        <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => removeWidget(widget.id)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#a1a1aa", padding: "4px" }}
                        title="Remove widget"
                      >
                        <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ flex: 1, minHeight: 0, position: "relative", padding: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  
                  {isEditing && activeDataset && (
                    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.96)", zIndex: 20, padding: 14, display: "flex", flexDirection: "column", justifyContent: "space-between", overflowY: "auto" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#a1a1aa", textTransform: "uppercase", borderBottom: "1px solid #f4f4f5", paddingBottom: 4 }}>Widget Config</span>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <label style={{ fontSize: 9, fontWeight: 700, color: "#71717a", textTransform: "uppercase" }}>Title</label>
                          <input 
                            type="text"
                            value={widget.title}
                            onChange={(e) => updateWidgetConfig(widget.id, { title: e.target.value })}
                            style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6, border: "1px solid #e4e4e7" }}
                          />
                        </div>

                        {widget.type !== "kpi" && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                            <label style={{ fontSize: 9, fontWeight: 700, color: "#71717a", textTransform: "uppercase" }}>X-Axis Column</label>
                            <select
                              value={widget.xCol}
                              onChange={(e) => updateWidgetConfig(widget.id, { xCol: e.target.value })}
                              style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6, border: "1px solid #e4e4e7" }}
                            >
                              {activeDataset.headers.map((h, i) => (
                                <option key={i} value={h}>{h}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <label style={{ fontSize: 9, fontWeight: 700, color: "#71717a", textTransform: "uppercase" }}>Y-Axis Column</label>
                          <select
                            value={widget.yCol}
                            onChange={(e) => updateWidgetConfig(widget.id, { yCol: e.target.value, kpiCol: e.target.value })}
                            style={{ padding: "4px 8px", fontSize: 11, borderRadius: 6, border: "1px solid #e4e4e7" }}
                          >
                            {activeDataset.headers.map((h, i) => (
                              <option key={i} value={h}>{h}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <button
                        onClick={() => setEditingWidgetId(null)}
                        style={{ backgroundColor: "#2563eb", color: "#ffffff", border: "none", padding: "6px", fontSize: 10, fontWeight: 700, borderRadius: 6, marginTop: 8 }}
                      >
                        Done
                      </button>
                    </div>
                  )}

                  {/* Rendering */}
                  {widget.type === "kpi" && (
                    <div style={{ textAlign: "center" }}>
                      <span style={{ fontSize: 36, fontWeight: 800, color: "#18181b" }}>
                        {renderKpiValue(widget)}
                      </span>
                    </div>
                  )}

                  {widget.type === "gauge" && <SvgGauge widget={widget} />}
                  {widget.type === "funnel" && <FunnelChart widget={widget} />}
                  {widget.type === "map" && <MapChart widget={widget} />}
                  {widget.type === "data" && <LedgerGrid widget={widget} />}

                  {widget.type === "line" && (
                    <div style={{ width: "100%", height: "100%", minHeight: 140 }}>
                      <Line data={getChartData(widget)} options={getChartOptions(widget)} />
                    </div>
                  )}

                  {widget.type === "area" && (
                    <div style={{ width: "100%", height: "100%", minHeight: 140 }}>
                      <Line data={getChartData(widget)} options={getChartOptions(widget)} />
                    </div>
                  )}

                  {widget.type === "bar" && (
                    <div style={{ width: "100%", height: "100%", minHeight: 140 }}>
                      <Bar data={getChartData(widget)} options={getChartOptions(widget)} />
                    </div>
                  )}

                  {widget.type === "pie" && (
                    <div style={{ width: "100%", height: "100%", minHeight: 140 }}>
                      <Pie data={getChartData(widget)} options={getChartOptions(widget)} />
                    </div>
                  )}

                  {widget.type === "scatter" && (
                    <div style={{ width: "100%", height: "100%", minHeight: 140 }}>
                      <Scatter data={getChartData(widget)} options={getChartOptions(widget)} />
                    </div>
                  )}
                </div>

                {!previewMode && (
                  <div 
                    onMouseDown={(e) => startResize(e, widget.id, widget.width, widget.height)}
                    className="resize-handle"
                    style={{ position: "absolute", right: 2, bottom: 2, width: 14, height: 14, cursor: "se-resize", opacity: 0.4 }}
                  >
                    <svg style={{ width: 10, height: 10, color: "#a1a1aa" }} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 19H5m14 0V5" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}

          {/* 3. POPUP CHATBOT WINDOW */}
          {showChatbot && (
            <div 
              style={{
                position: "absolute",
                left: `${chatbotPosition.x}px`,
                top: `${chatbotPosition.y}px`,
                width: `${chatbotSize.width}px`,
                height: `${chatbotSize.height}px`,
                zIndex: chatbotZIndex,
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                backdropFilter: "blur(12px)",
                borderRadius: "20px",
                boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
                border: "1px solid #e4e4e7",
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              {/* Chat Header */}
              <div 
                onMouseDown={(e) => startDrag(e, "chatbot", chatbotPosition.x, chatbotPosition.y)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  backgroundColor: "#ffffff",
                  borderBottom: "1px solid #f4f4f5",
                  cursor: "move"
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 600, color: "#27272a" }}>AI Assistant</span>
                <button 
                  onClick={() => setShowChatbot(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#a1a1aa", padding: "2px" }}
                >
                  <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Messages list */}
              <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "#fafafa" }}>
                {chatbotMessages.map((msg, idx) => {
                  const isUser = msg.role === "user";
                  return (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                      <div 
                        style={{
                          padding: "10px 14px",
                          borderRadius: isUser ? "16px 16px 2px 16px" : "16px 16px 16px 2px",
                          fontSize: "12px",
                          maxWidth: "85%",
                          lineHeight: "1.5",
                          backgroundColor: isUser ? "#2563eb" : "#ffffff",
                          color: isUser ? "#ffffff" : "#27272a",
                          border: isUser ? "none" : "1px solid #e4e4e7",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)"
                        }}
                      >
                        {msg.content}
                      </div>
                      {msg.time && (
                        <span style={{ fontSize: "9px", color: "#a1a1aa", marginTop: "3px", padding: "0 4px" }}>{msg.time}</span>
                      )}
                    </div>
                  );
                })}

                {/* Quick Suggestions */}
                {chatbotMessages.length < 4 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                    {["Create Chart", "Show Trends", "Export Data"].map((action, i) => (
                      <button
                        key={i}
                        onClick={() => sendChatMessage(undefined, action)}
                        style={{
                          backgroundColor: "#ffffff",
                          border: "1px solid #bfdbfe",
                          color: "#2563eb",
                          fontSize: "10px",
                          fontWeight: 600,
                          padding: "4px 10px",
                          borderRadius: "6px",
                          cursor: "pointer"
                        }}
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={chatbotMessagesEndRef} />
              </div>

              {/* Input form */}
              <form onSubmit={(e) => sendChatMessage(e)} style={{ padding: "10px", backgroundColor: "#ffffff", borderTop: "1px solid #f4f4f5", display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Ask about your data or charts..."
                  style={{
                    flex: 1,
                    backgroundColor: "#f4f4f5",
                    border: "none",
                    borderRadius: "20px",
                    padding: "8px 14px",
                    fontSize: "12px",
                    outline: "none",
                    color: "#18181b"
                  }}
                />
                <button 
                  type="submit" 
                  disabled={!chatInput.trim() || chatLoading}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    opacity: (!chatInput.trim() || chatLoading) ? 0.5 : 1
                  }}
                >
                  <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </button>
              </form>
            </div>
          )}

        </div>
      </div>

      {/* 4. CHARTS & WIDGETS SELECTION POPOVER */}
      {showChartsMenu && (
        <div 
          style={{
            position: "fixed",
            bottom: "100px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#ffffff",
            borderRadius: "28px",
            boxShadow: "0 20px 48px rgba(0,0,0,0.16)",
            border: "1px solid rgba(27, 27, 27, 0.1)",
            padding: "22px 24px",
            zIndex: 60,
            width: "400px",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#18181b" }}>Charts & Widgets</span>
            <div style={{ fontSize: "12px", color: "#71717a", marginTop: "2px" }}>Choose a visualization type</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px" }}>
            {[
              { type: "bar", label: "Bar", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.25C3 12.5596 3.55964 12 4.25 12H6.75C7.44036 12 8 12.5596 8 13.25V18.75C8 19.4404 7.44036 20 6.75 20H4.25C3.55964 20 3 19.4404 3 18.75V13.25ZM9 8.25C9 7.55964 9.55964 7 10.25 7H12.75C13.4404 7 14 7.55964 14 8.25V18.75C14 19.4404 13.4404 20 12.75 20H10.25C9.55964 20 9 19.4404 9 18.75V8.25ZM15 4.25C15 3.55964 15.5596 3 16.25 3H18.75C19.4404 3 20 3.55964 20 4.25V18.75C20 19.4404 19.4404 20 18.75 20H16.25C15.5596 20 15 19.4404 15 18.75V4.25Z" /> },
              { type: "line", label: "Line", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /> },
              { type: "area", label: "Area", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22" /> },
              { type: "pie", label: "Pie", icon: <g><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" /><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" /></g> },
              { type: "scatter", label: "Scatter", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
              { type: "gauge", label: "Gauge", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /> },
              { type: "funnel", label: "Funnel", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18l-6 7.5v6l-6 1.5v-7.5L3 4.5z" /> },
              { type: "map", label: "Map", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l.406.34c.125.104.224.239.29.388l.04.09c.085.193.078.413-.02.6l-.18.34a.75.75 0 01-.659.414H11a.75.75 0 00-.75.75v.547a.75.75 0 00.357.642l.593.35c.22.13.357.37.357.629v.114c0 .265-.13.51-.357.648l-.588.356a.75.75 0 01-.749.015l-.366-.201a.75.75 0 00-.751-.004l-.58.329a.75.75 0 01-.67.039l-.358-.168a.75.75 0 00-.94.31l-.117.208a.75.75 0 01-.94.31l-.23-.105a.75.75 0 00-.958.364l-.111.222c-.22.438-.72.696-1.206.611l-.33-.058a.75.75 0 00-.753.36l-.165.293a.75.75 0 01-.995.314l-.333-.166a.75.75 0 00-.923.188l-.297.298a.75.75 0 01-1.06 0l-.114-.114a.75.75 0 00-.462-.22l-.567-.057a.75.75 0 00-.784.579l-.028.11a.75.75 0 01-.62.564l-.34.057a.75.75 0 00-.63.535l-.058.232a.75.75 0 01-.38.487l-.333.167a.75.75 0 00-.418.665v.231M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25z" /> },
              { type: "kpi", label: "KPI", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-15 3h15m-15 3h15m-15 3h15" /> },
              { type: "data", label: "Data", icon: <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" /> }
            ].map((opt) => (
              <button
                key={opt.type}
                onClick={() => addWidgetFromToolbar(opt.type as any)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#52525b"
                }}
              >
                <div style={{ width: 44, height: 44, borderRadius: "14px", backgroundColor: "#f4f4f5", border: "1px solid #e4e4e7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                    {opt.icon}
                  </svg>
                </div>
                <span style={{ fontSize: "11px", fontWeight: 500, color: "#3f3f46" }}>{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. FLOATING BOTTOM CAPSULE TOOLBAR - Larger, soft rounded square buttons */}
      {!previewMode && (
        <div 
          style={{
            position: "fixed",
            bottom: "24px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(255, 255, 255, 0.98)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(27, 27, 27, 0.12)",
            padding: "8px 14px",
            borderRadius: "28px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 12px 36px rgba(0,0,0,0.12)",
            zIndex: 50
          }}
        >
          {/* 1. File Folder Button */}
          <button 
            onClick={() => setActiveTab("datasources")}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              backgroundColor: "#f4f4f5",
              border: "1px solid #e4e4e7",
              cursor: "pointer",
              color: "#3f3f46",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Data Sources"
          >
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
          </button>

          {/* 2. Plus Button -> Toggles Charts & Widgets Selector */}
          <button 
            onClick={() => setShowChartsMenu(!showChartsMenu)}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              backgroundColor: showChartsMenu ? "#dbeafe" : "#f4f4f5",
              border: showChartsMenu ? "1px solid #bfdbfe" : "1px solid #e4e4e7",
              cursor: "pointer",
              color: showChartsMenu ? "#2563eb" : "#3f3f46",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Add Chart or Widget"
          >
            <svg style={{ width: 22, height: 22 }} fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </button>

          {/* 3. Robot / AI Assistant Button */}
          <button 
            onClick={() => {
              setShowChatbot(!showChatbot);
              bringToFront("chatbot");
            }}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              backgroundColor: showChatbot ? "#2563eb" : "#f4f4f5",
              border: showChatbot ? "1px solid #2563eb" : "1px solid #e4e4e7",
              cursor: "pointer",
              color: showChatbot ? "#ffffff" : "#3f3f46",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Toggle AI Assistant Chatbot"
          >
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.625.625 0 11-1.25 0 .625.625 0 011.25 0zm4.5 0a.625.625 0 11-1.25 0 .625.625 0 011.25 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.58 16.24 3 14.243 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
            </svg>
          </button>

          {/* 4. Sparkles Button -> Toggles Charts & Widgets Selector */}
          <button 
            onClick={() => setShowChartsMenu(!showChartsMenu)}
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "14px",
              backgroundColor: showChartsMenu ? "#dbeafe" : "#f4f4f5",
              border: showChartsMenu ? "1px solid #bfdbfe" : "1px solid #e4e4e7",
              cursor: "pointer",
              color: showChartsMenu ? "#2563eb" : "#3f3f46",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Charts & Widgets Menu"
          >
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21m0 0l-.813-5.096L9 21zm0 0h-.01m-4.707-6.096A9.001 9.001 0 0117.73 6.27A9.001 9.001 0 0117.73 17.73l-4.707-6.096z" />
            </svg>
          </button>

        </div>
      )}

    </div>
  );
}
