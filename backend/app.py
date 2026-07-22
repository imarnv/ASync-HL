import io
import os
import httpx
import numpy as np
import pandas as pd
import pdfplumber
from fastapi import FastAPI, UploadFile, File, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="Async Data Analyst Backend")

# Configure CORS to allow connection from our Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Point(BaseModel):
    x: float
    y: float

class KMeansRequest(BaseModel):
    points: List[Point]
    k: int

class KMeansResponse(BaseModel):
    assignments: List[int]
    centroids: List[Point]

class RegressionRequest(BaseModel):
    x: List[float]
    y: List[float]

class RegressionResponse(BaseModel):
    slope: float
    intercept: float
    r_squared: float
    trendline: List[Point]

class ChatRequest(BaseModel):
    message: str
    model: str  # "gemini", "gpt", "claude"
    model_name: Optional[str] = None
    api_key: Optional[str] = None
    context: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    error: Optional[str] = None


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = file.filename.lower()
    content = await file.read()
    
    if not content:
        raise HTTPException(status_code=400, detail="File is empty")
        
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(content))
            return parse_dataframe(df, "csv")
            
        elif filename.endswith(".xlsx") or filename.endswith(".xls"):
            df = pd.read_excel(io.BytesIO(content))
            return parse_dataframe(df, "excel")
            
        elif filename.endswith(".pdf"):
            text = ""
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
            
            return {
                "headers": ["Content"],
                "rows": [[text]],
                "file_type": "pdf"
            }
        else:
            raise HTTPException(
                status_code=400, 
                detail="Unsupported file format. Please upload CSV, Excel, or PDF."
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse file: {str(e)}")


def parse_dataframe(df: pd.DataFrame, file_type: str):
    # Fill NaN values with None so they translate to JSON null
    df_clean = df.replace({np.nan: None})
    
    headers = [str(col) for col in df_clean.columns]
    
    raw_rows = df_clean.values.tolist()
    rows = []
    
    # Ensure all numerical values are python-native ints/floats for JSON compatibility
    for r in raw_rows:
        new_row = []
        for cell in r:
            if isinstance(cell, (np.integer, np.int64)):
                new_row.append(int(cell))
            elif isinstance(cell, (np.floating, np.float64)):
                new_row.append(float(cell))
            elif pd.isna(cell):
                new_row.append(None)
            else:
                new_row.append(cell)
        rows.append(new_row)
        
    return {
        "headers": headers,
        "rows": rows,
        "file_type": file_type
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat_analyst(req: ChatRequest):
    model_type = req.model.lower()
    api_key = req.api_key.strip() if req.api_key else None
    
    model_name = req.model_name
    if not model_name:
        if model_type == "gemini":
            model_name = "gemini-1.5-flash"
        elif model_type == "gpt":
            model_name = "gpt-4o-mini"
        elif model_type == "claude":
            model_name = "claude-3-haiku-20240307"
        else:
            model_name = "gemini-1.5-flash"
            
    system_instructions = "You are 'async', a helpful AI Data Analyst. You answer questions about datasets uploaded by the user. Rely on the provided context if present."
    
    if req.context:
        combined_prompt = f"{system_instructions}\n\nDATASET CONTEXT:\n{req.context}\n\nUSER PROMPT:\n{req.message}"
    else:
        combined_prompt = f"{system_instructions}\n\nUSER PROMPT:\n{req.message}"
        
    async with httpx.AsyncClient() as client:
        try:
            if model_type == "gemini":
                key = api_key or os.environ.get("GEMINI_API_KEY")
                if not key:
                    return ChatResponse(reply="", error="Gemini API key is required. Please add it in settings.")
                    
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={key}"
                body = {
                    "contents": [{
                        "parts": [{"text": combined_prompt}]
                    }]
                }
                
                resp = await client.post(url, json=body, timeout=60.0)
                if resp.status_code == 200:
                    res_json = resp.json()
                    reply = res_json["candidates"][0]["content"]["parts"][0]["text"]
                    return ChatResponse(reply=reply)
                else:
                    return ChatResponse(reply="", error=f"Gemini API error ({resp.status_code}): {resp.text}")
                    
            elif model_type == "gpt":
                key = api_key or os.environ.get("OPENAI_API_KEY")
                if not key:
                    return ChatResponse(reply="", error="OpenAI API key is required. Please add it in settings.")
                    
                url = "https://api.openai.com/v1/chat/completions"
                headers = {"Authorization": f"Bearer {key}"}
                body = {
                    "model": model_name,
                    "messages": [{"role": "user", "content": combined_prompt}]
                }
                
                resp = await client.post(url, json=body, headers=headers, timeout=60.0)
                if resp.status_code == 200:
                    res_json = resp.json()
                    reply = res_json["choices"][0]["message"]["content"]
                    return ChatResponse(reply=reply)
                else:
                    return ChatResponse(reply="", error=f"OpenAI API error ({resp.status_code}): {resp.text}")
                    
            elif model_type == "claude":
                key = api_key or os.environ.get("ANTHROPIC_API_KEY")
                if not key:
                    return ChatResponse(reply="", error="Anthropic API key is required. Please add it in settings.")
                    
                url = "https://api.anthropic.com/v1/messages"
                headers = {
                    "x-api-key": key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                body = {
                    "model": model_name,
                    "max_tokens": 2048,
                    "messages": [{"role": "user", "content": combined_prompt}]
                }
                
                resp = await client.post(url, json=body, headers=headers, timeout=60.0)
                if resp.status_code == 200:
                    res_json = resp.json()
                    reply = res_json["content"][0]["text"]
                    return ChatResponse(reply=reply)
                else:
                    return ChatResponse(reply="", error=f"Anthropic API error ({resp.status_code}): {resp.text}")
            else:
                return ChatResponse(reply="", error="Unsupported model type selected.")
                
        except Exception as e:
            return ChatResponse(reply="", error=f"API connection failed: {str(e)}")


@app.post("/api/ml/regression", response_model=RegressionResponse)
async def regression_analysis(req: RegressionRequest):
    n = len(req.x)
    if n != len(req.y):
        raise HTTPException(status_code=400, detail="X and Y data lists must have the same length")
    if n < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 points for regression analysis")
        
    try:
        x = np.array(req.x, dtype=float)
        y = np.array(req.y, dtype=float)
        
        mean_x = np.mean(x)
        mean_y = np.mean(y)
        
        num = np.sum((x - mean_x) * (y - mean_y))
        den = np.sum((x - mean_x) ** 2)
        
        if den == 0.0:
            raise HTTPException(status_code=400, detail="X values are constant; regression cannot run")
            
        slope = float(num / den)
        intercept = float(mean_y - slope * mean_x)
        
        ss_res = np.sum((y - (slope * x + intercept)) ** 2)
        ss_tot = np.sum((y - mean_y) ** 2)
        r_squared = 1.0 if ss_tot == 0.0 else float(1.0 - (ss_res / ss_tot))
        
        min_x = float(np.min(x))
        max_x = float(np.max(x))
        
        trendline = [
            Point(x=min_x, y=slope * min_x + intercept),
            Point(x=max_x, y=slope * max_x + intercept)
        ]
        
        return RegressionResponse(
            slope=slope,
            intercept=intercept,
            r_squared=r_squared,
            trendline=trendline
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Regression failed: {str(e)}")


@app.post("/api/ml/kmeans", response_model=KMeansResponse)
async def kmeans_clustering(req: KMeansRequest):
    if not req.points:
        return KMeansResponse(assignments=[], centroids=[])
        
    try:
        points = np.array([[p.x, p.y] for p in req.points])
        k = min(req.k, len(points))
        
        if k <= 0:
            raise HTTPException(status_code=400, detail="k must be greater than 0")
            
        # K-Means algorithm implementation
        # Initialize centroids randomly from points
        indices = np.random.choice(len(points), k, replace=False)
        centroids = points[indices].copy()
        assignments = np.zeros(len(points), dtype=int)
        
        for _ in range(100):
            # Step 1: Assign points to nearest centroid
            distances = np.linalg.norm(points[:, np.newaxis] - centroids, axis=2)
            new_assignments = np.argmin(distances, axis=1)
            
            if np.array_equal(assignments, new_assignments):
                break
                
            assignments = new_assignments
            
            # Step 2: Recalculate centroids
            for c_idx in range(k):
                assigned_points = points[assignments == c_idx]
                if len(assigned_points) > 0:
                    centroids[c_idx] = np.mean(assigned_points, axis=0)
                    
        res_centroids = [Point(x=float(c[0]), y=float(c[1])) for c in centroids]
        res_assignments = [int(a) for a in assignments]
        
        return KMeansResponse(assignments=res_assignments, centroids=res_centroids)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"K-Means clustering failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=True)
