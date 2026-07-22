# ASync — Advanced AI Data Analyst Workspace

**ASync** is a premium, high-performance, stateless data analytics workspace. It enables users to connect business documents (Excel spreadsheets, CSVs, PDFs), visualize custom KPI graphs on an interactive canvas, run machine learning algorithms, and ask questions about their datasets using state-of-the-art LLMs (Gemini, GPT, Claude).

---

## 🚀 Key Features

* **Instant Document Parser**: Upload CSV, XLSX, XLS, and PDF files. The backend extracts structural columns, numbers, and text in milliseconds.
* **Playground Canvas**: Build dynamic visual widget dashboards (Line, Bar, Area, and Pie charts) and KPI summaries (Sum, Mean, Count) on a clean, responsive layout.
* **ML Studio**: Execute core machine learning models—specifically **linear regression** (slope, intercept, $R^2$ trendlines) and **K-Means clustering** (centroid mapping and group assignments) on custom data axes.
* **Excel Chat**: Talk to your files using Google Gemini, OpenAI GPT, or Anthropic Claude. The system bundles the dataset preview directly into the context window for natural language queries.
* **Analytical Reports**: Generate export-ready profiling summaries of connected attributes, values, and notes, with print-optimized CSS for PDF export.

---

## 🛠️ System Architecture

ASync uses a lightweight, decoupled web architecture:

```mermaid
flowchart TB
    %% Nodes styling
    classDef frontend fill:#faf6f0,stroke:#ac7d58,stroke-width:2px,color:#1b1b1b;
    classDef backend fill:#f3f4f6,stroke:#4b5563,stroke-width:2px,color:#1b1b1b;
    classDef client fill:#ffffff,stroke:#1b1b1b,stroke-width:1px,stroke-dasharray: 5 5,color:#1b1b1b;
    classDef ext fill:#fef2f2,stroke:#ef4444,stroke-width:1px,color:#1b1b1b;

    %% Subgraphs
    subgraph Frontend_App ["Next.js Workspace Application (Port 3000)"]
        direction TB
        PageState["State Manager (page.tsx)<br/>- activeTab<br/>- activeDataset (headers, rows, type)"]
        
        subgraph Views ["Workspace Tabs"]
            HomeTab["Home Tab<br/>- Onboarding Portal<br/>- Stats dashboard"]
            DataTab["Data Sources Tab<br/>- Drag-and-Drop file uploader<br/>- Preview data grid"]
            PlaygroundTab["Playground Canvas Tab<br/>- Drag & configure KPI widgets<br/>- Sum/Mean/Count calculations<br/>- Line/Bar/Pie/Area ChartJS renders"]
            ChatTab["Excel Chat Tab<br/>- AI Model & API Key selector<br/>- Dataset Context assembler<br/>- Chat message history thread"]
            MLTab["ML Studio Tab<br/>- Axis selector (numeric)<br/>- Regression / K-Means controls<br/>- Scatter plot visualization"]
            ReportsTab["Reports Tab<br/>- Interactive Data Profile dictionary<br/>- Print/PDF output styles"]
        end
    end

    subgraph Backend_App ["FastAPI Server (Port 8000)"]
        direction TB
        UploadAPI["/api/upload Handler<br/>- CSV / Excel Pandas parser<br/>- PDF PDFPlumber parser"]
        ChatAPI["/api/chat Handler<br/>- Context template injector<br/>- Async LLM client routing"]
        MLRegression["/api/ml/regression Handler<br/>- NumPy slope, intercept, R2<br/>- Trendline coordinates generator"]
        MLKmeans["/api/ml/kmeans Handler<br/>- Iterative centroid correction<br/>- Cluster assignment generator"]
    end

    subgraph API_Providers ["External LLM APIs"]
        GeminiAPI["Google Gemini v1beta"]
        OpenaiAPI["OpenAI GPT API"]
        AnthropicAPI["Anthropic Claude API"]
    end

    %% Apply CSS classes
    class PageState,HomeTab,DataTab,PlaygroundTab,ChatTab,MLTab,ReportsTab frontend;
    class UploadAPI,ChatAPI,MLRegression,MLKmeans backend;
    class GeminiAPI,OpenaiAPI,AnthropicAPI ext;

    %% Connections
    DataTab -->|"1. CSV/XLSX/PDF file upload"| UploadAPI
    UploadAPI -->|"2. JSON (headers, rows, file_type)"| PageState
    
    PageState -.->|"Passes activeDataset"| PlaygroundTab
    PageState -.->|"Passes activeDataset"| ChatTab
    PageState -.->|"Passes activeDataset"| MLTab
    PageState -.->|"Passes activeDataset"| ReportsTab

    PlaygroundTab -->|"Compute math locally"| PlaygroundTab
    ReportsTab -->|"window.print()"| PDF[PDF Report file]

    ChatTab -->|"3. JSON query, api_key, context"| ChatAPI
    ChatAPI --> GeminiAPI
    ChatAPI --> OpenaiAPI
    ChatAPI --> AnthropicAPI
    GeminiAPI & OpenaiAPI & AnthropicAPI -->|"4. Markdown response text"| ChatAPI
    ChatAPI -->|"5. ChatResponse JSON"| ChatTab

    MLTab -->|"3. JSON data coordinates"| MLRegression
    MLRegression -->|"4. RegressionResponse slope, intercept, R2, trendline"| MLTab
    
    MLTab -->|"3. JSON coordinate points, group count k"| MLKmeans
    MLKmeans -->|"4. KMeansResponse assignments, centroids"| MLTab
```

* **Frontend**: Built using Next.js, React, ChartJS, TailwindCSS, and Axios. Source files are located in [frontend/src/app](file:///Users/arnavmehta/Desktop/ASync/frontend/src/app) and [frontend/src/components](file:///Users/arnavmehta/Desktop/ASync/frontend/src/components).
* **Backend**: A standalone, stateless FastAPI server driven by Pandas, NumPy, and PDFPlumber. Source code is located in [backend/app.py](file:///Users/arnavmehta/Desktop/ASync/backend/app.py).

---

## 📈 Current Progress & Project Status

### Completed Integrations
* **100% Frontend Implementation**: Home page, interactive sidebar navigation, drag-and-drop file uploaders, canvas dashboard widget configuration, chat thread bubbles, and scatter plot matrices are completely built.
* **100% API Coverage**: The backend script [app.py](file:///Users/arnavmehta/Desktop/ASync/backend/app.py) successfully exposes all 4 critical endpoints required by the Next.js frontend:
  * `POST /api/upload` (Extracts tabular data or PDF text)
  * `POST /api/chat` (Forwards prompts to Gemini, Claude, or GPT)
  * `POST /api/ml/regression` (Linear regression math)
  * `POST /api/ml/kmeans` (Clustering algorithm)

### Ongoing Improvements & Gaps
* **Datetime/Timestamp Formatting**: Handling date/time values parsed from Excel so that they serialize to JSON properly.
* **xls Legacy Format Support**: Adding `xlrd` to backend dependencies for old spreadsheet compatibility.

---

## ⚙️ Running Locally

Follow these instructions to spin up the local development environment:

### 1. Start the FastAPI Backend
Ensure Python 3.10+ is installed on your machine.
```bash
cd backend
pip install -r requirements.txt
python app.py
```
*The API will start running at `http://127.0.0.1:8000`.*

### 2. Start the Next.js Frontend
Ensure Node.js 18+ is installed on your machine.
```bash
cd frontend
npm install
npm run dev
```
*The interface will start running at `http://localhost:3000`.*

---

## 🔑 Credentials Configuration

API keys can be supplied in two ways:
1. **Frontend (Recommended)**: Click **API Credentials** in the sidebar to save keys (`localStorage`) locally in your browser. They will be passed to the backend per request.
2. **Backend Environment**: Set variables on your backend environment:
   * `GEMINI_API_KEY`
   * `OPENAI_API_KEY`
   * `ANTHROPIC_API_KEY`
