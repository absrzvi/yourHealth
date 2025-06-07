"""
MCP-RAG AI Coach Server (Phase 3+): PostgreSQL + pgvector, OpenAI, FastAPI
Implements ingestion, hybrid search, and REST endpoints as per ai-rag.md.
"""

import os
import asyncio
import sys
import time
import logging
import json
from typing import Optional, Dict, Any, List, AsyncGenerator, Union
from datetime import datetime

from fastapi import FastAPI, HTTPException, Depends, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, RedirectResponse
from pydantic import BaseModel, HttpUrl

# Try to import optional dependencies
try:
    import asyncpg
except ImportError:
    asyncpg = None
    print("Warning: asyncpg not installed. Database functionality will be disabled.")

try:
    import aiohttp
except ImportError:
    aiohttp = None
    print("Warning: aiohttp not installed. HTTP client functionality will be disabled.")

try:
    import openai
except ImportError:
    openai = None
    print("Warning: openai package not installed. OpenAI functionality will be disabled.")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("Warning: python-dotenv not installed. Environment variables must be set manually.")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("fastapi.log")
    ]
)
logger = logging.getLogger(__name__)

# Log environment status
logger.info("Starting MCP-RAG AI Coach Server")
if not asyncpg:
    logger.warning("No database connection string provided. Running without database.")
else:
    logger.info("Database support enabled")

if aiohttp is None:
    logger.warning("aiohttp not available. HTTP client functionality will be limited.")
else:
    logger.info("HTTP client support enabled")

# Configure CORS
origins = [
    "http://localhost:3000",  # Next.js dev server
    "http://localhost:8000",  # FastAPI server
    "http://127.0.0.1:3000",  # Alternative localhost
    "http://127.0.0.1:8000",  # Alternative localhost
]

app = FastAPI(
    title="MCP-RAG AI Coach Server",
    description="AI Coach backend service with RAG capabilities",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

POSTGRES_DSN = os.getenv("POSTGRES_DSN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# --- FastAPI app ---
app = FastAPI(title="MCP-RAG AI Coach Server")

# Log startup
logger.info("Starting MCP-RAG AI Coach Server")

# --- Database connection ---
db_pool = None

@app.on_event("startup")
async def startup():
    global db_pool
    
    # Initialize database connection if DSN is provided
    if POSTGRES_DSN and asyncpg is not None:
        try:
            db_pool = await asyncpg.create_pool(POSTGRES_DSN)
            logger.info("Connected to the database")
        except Exception as e:
            logger.error(f"Error connecting to the database: {e}")
            db_pool = None
    else:
        db_pool = None
        if not POSTGRES_DSN:
            logger.warning("No database connection string provided. Running without database.")
        else:
            logger.warning("asyncpg not available. Running without database.")
    
    # Set OpenAI API key if provided
    if OPENAI_API_KEY and openai is not None:
        try:
            openai.api_key = OPENAI_API_KEY
            logger.info("OpenAI API key set")
        except Exception as e:
            logger.error(f"Error setting OpenAI API key: {e}")
    else:
        if not OPENAI_API_KEY:
            logger.warning("No OpenAI API key provided. Some features may not work.")
        else:
            logger.warning("OpenAI package not available. Some features may not work.")

@app.on_event("shutdown")
async def shutdown():
    if db_pool:
        await db_pool.close()
        logger.info("Database connection closed")

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
    if not db_pool:
        raise HTTPException(
            status_code=503,
            detail="Database not available. Please check your database connection."
        )
    
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
        logger.error(f"Error in ingest_medical_knowledge: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Hybrid search endpoint ---
@app.post("/search")
async def hybrid_search(req: SearchRequest):
    if not db_pool:
        raise HTTPException(
            status_code=503,
            detail="Database not available. Please check your database connection."
        )
    
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
        logger.error(f"Error in hybrid_search: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Streaming chat endpoint ---
class ChatRequest(BaseModel):
    message: str
    context: Dict[str, Any] = {}

async def generate_chat_response(message: str) -> AsyncGenerator[str, None]:
    """Generate a streaming chat response using Ollama"""
    import aiohttp
    import logging
    
    logger = logging.getLogger(__name__)
    
    # Ollama API endpoint (default when running locally)
    OLLAMA_API_URL = "http://localhost:11434/api/chat"
    TIMEOUT = aiohttp.ClientTimeout(total=300)  # 5 minute timeout
    
    # Prepare the request payload for Ollama
    payload = {
        "model": "llama3.2",  # Using llama3.2 as per the logs
        "messages": [
            {"role": "system", "content": "You are a helpful health assistant named Aria."},
            {"role": "user", "content": message}
        ],
        "stream": True,
        "options": {
            "temperature": 0.7,
            "top_p": 0.9,
            "num_ctx": 2048
        }
    }
    
    logger.info(f"Sending request to Ollama with payload: {json.dumps(payload, indent=2)}")
    
    try:
        # Test Ollama connection first
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get("http://localhost:11434/api/tags", timeout=5) as resp:
                    if resp.status != 200:
                        error_text = await resp.text()
                        raise Exception(f"Ollama API not available: {resp.status} - {error_text}")
            except Exception as e:
                logger.error(f"Ollama connection test failed: {str(e)}")
                yield f"data: {json.dumps({'error': f'Ollama server error: {str(e)}'})}\n\n"
                return
            
            # Now make the chat request
            try:
                logger.info(f"Making streaming request to Ollama...")
                async with session.post(
                    OLLAMA_API_URL, 
                    json=payload,
                    timeout=TIMEOUT,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    logger.info(f"Ollama response status: {response.status}")
                    
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error(f"Ollama API error: {response.status} - {error_text}")
                        yield f"data: {json.dumps({'error': f'Ollama API error: {response.status} - {error_text}'})}\n\n"
                        return
                    
                    buffer = ""
                    async for line in response.content:
                        if not line:
                            continue
                            
                        try:
                            # Decode the line and process it
                            line = line.decode('utf-8').strip()
                            if not line:
                                continue
                                
                            logger.debug(f"Received chunk: {line}")
                                
                            # Parse the JSON response from Ollama
                            data = json.loads(line)
                            
                            # Check if this is a valid message chunk
                            if 'message' in data and 'content' in data['message']:
                                content = data['message']['content']
                                if content:
                                    logger.debug(f"Yielding content: {content}")
                                    yield f"data: {json.dumps({'content': content})}\n\n"
                                    
                            # Check if this is the final message
                            if data.get('done', False):
                                logger.info("Ollama stream completed successfully")
                                yield 'data: {\"done\": true}\n\n'
                                return
                                
                        except json.JSONDecodeError as je:
                            logger.warning(f"Failed to parse JSON: {line}, error: {str(je)}")
                            continue
                        except Exception as e:
                            logger.error(f"Error processing chunk: {str(e)}")
                            yield f"data: {json.dumps({'error': f'Error processing response: {str(e)}'})}\n\n"
                            return
                            
            except asyncio.TimeoutError:
                error_msg = "Request to Ollama timed out"
                logger.error(error_msg)
                yield f"data: {json.dumps({'error': error_msg})}\n\n"
            except aiohttp.ClientError as ce:
                error_msg = f"HTTP client error: {str(ce)}"
                logger.error(error_msg)
                yield f"data: {json.dumps({'error': error_msg})}\n\n"
            except Exception as e:
                error_msg = f"Unexpected error: {str(e)}"
                logger.error(error_msg, exc_info=True)
                yield f"data: {json.dumps({'error': error_msg})}\n\n"
                
    except Exception as e:
        error_msg = f"Failed to process chat request: {str(e)}"
        logger.error(error_msg, exc_info=True)
        yield f"data: {json.dumps({'error': error_msg})}\n\n"
    finally:
        # Ensure we always close the stream properly
        logger.info("Chat stream ended")
        yield 'data: {\"done\": true}\n\n'

@app.post("/chat/stream")
async def chat_stream(chat_request: ChatRequest):
    """Streaming chat endpoint that returns Server-Sent Events"""
    return StreamingResponse(
        generate_chat_response(chat_request.message),
        media_type="text/event-stream",
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        }
    )

# --- Root endpoint for health checks ---
@app.get("/", response_model=dict)
async def root():
    """Root endpoint that provides basic service information."""
    return {
        "status": "ok",
        "service": "MCP-RAG AI Coach Server",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/chat",
            "chat_stream": "/chat/stream",
            "health": "/health"
        },
        "timestamp": datetime.utcnow().isoformat()
    }

# --- Health check endpoint ---
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "timestamp": time.time(),
        "service": "MCP-RAG AI Coach Server"
    }

# --- Main entrypoint for local dev ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
