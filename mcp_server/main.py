"""
MCP-RAG AI Coach Server (Phase 3+): PostgreSQL + pgvector, OpenAI, FastAPI
Implements ingestion, hybrid search, and REST endpoints as per ai-rag.md.
"""

import os
import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import asyncpg
import openai
from typing import List, Dict, Any
from dotenv import load_dotenv

# --- Load environment variables ---
load_dotenv()

POSTGRES_DSN = os.getenv("POSTGRES_DSN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- FastAPI app ---
app = FastAPI(title="MCP-RAG AI Coach Server")

# --- Database connection ---
db_pool = None

@app.on_event("startup")
async def startup():
    global db_pool
    db_pool = await asyncpg.create_pool(dsn=POSTGRES_DSN)
    openai.api_key = OPENAI_API_KEY

@app.on_event("shutdown")
async def shutdown():
    await db_pool.close()

# --- Pydantic models ---
class IngestRequest(BaseModel):
    content: str
    metadata: Dict[str, Any]

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5

# --- Ingestion endpoint ---
@app.post("/ingest")
async def ingest_medical_knowledge(req: IngestRequest):
    try:
        # Generate OpenAI embedding
        emb = await openai.Embedding.acreate(
            input=req.content, model="text-embedding-3-small"
        )
        vector = emb["data"][0]["embedding"]
        # Store in pgvector table (medical_knowledge)
        async with db_pool.acquire() as conn:
            await conn.execute(
                """
                INSERT INTO medical_knowledge (content, metadata, embedding)
                VALUES ($1, $2, $3)
                """,
                req.content, req.metadata, vector
            )
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Hybrid search endpoint ---
@app.post("/search")
async def hybrid_search(req: SearchRequest):
    try:
        # Embed query
        emb = await openai.Embedding.acreate(
            input=req.query, model="text-embedding-3-small"
        )
        query_vec = emb["data"][0]["embedding"]
        # Vector search (pgvector)
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT content, metadata, embedding <#> $1 AS distance
                FROM medical_knowledge
                ORDER BY embedding <#> $1 ASC
                LIMIT $2
                """,
                query_vec, req.top_k
            )
        # Return results
        return [{"content": r["content"], "metadata": r["metadata"], "distance": r["distance"]} for r in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Health check ---
@app.get("/health")
async def health():
    return {"status": "ok"}

# --- Main entrypoint for local dev ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
