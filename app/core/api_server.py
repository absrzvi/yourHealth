"""
FastAPI backend to serve AI responses using local Ollama models.
This service acts as a bridge between the Next.js frontend and the local Ollama LLM.
"""
import os
import json
import time
import asyncio
import logging
from typing import Dict, List, Any, Optional, AsyncGenerator

# Set up FastAPI with minimal dependencies
try:
    from fastapi import FastAPI, Request, HTTPException, Depends
    from fastapi.responses import JSONResponse, StreamingResponse
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field
except ImportError:
    print("Installing FastAPI dependencies...")
    import subprocess
    subprocess.check_call(["pip", "install", "fastapi", "uvicorn"])
    from fastapi import FastAPI, Request, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse
    from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Import our simple AI agents
from app.core.simple_llm_engine import SimpleOllamaEngine
from app.core.simple_ai_agents import SimpleAIOrchestrator, AgentRole, SimpleHealthAgent

# Initialize FastAPI app
app = FastAPI(title="Health AI API", description="Local Health AI Assistant API")

# Configure CORS to allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be restricted
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define request models
class ChatMessage(BaseModel):
    message: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class HealthQuery(BaseModel):
    query: str
    user_profile: Optional[Dict[str, Any]] = {}
    include_sources: Optional[bool] = False
    
class ModelInfo(BaseModel):
    name: str

class ApiResponse(BaseModel):
    success: bool
    data: Any
    error: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: time.strftime("%Y-%m-%d %H:%M:%S"))

# Initialize LLM engine and AI orchestrator
llm_engine = SimpleOllamaEngine(
    host=os.environ.get("OLLAMA_HOST", "localhost"),
    port=int(os.environ.get("OLLAMA_PORT", 11434)),  # Default Ollama port
    model_name=os.environ.get("OLLAMA_PRIMARY_MODEL", "llama3.2:latest"),  # Primary model
    fallback_model=os.environ.get("OLLAMA_FALLBACK_MODEL", "phi3:mini")  # Fallback model
)

# Initialize the orchestrator - agents will be automatically created
orchestrator = SimpleAIOrchestrator(llm_engine)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Health AI API", "using": "local Ollama LLM"}

@app.get("/models")
async def list_models() -> ApiResponse:
    """List available Ollama models"""
    try:
        models = await llm_engine.list_models()
        return ApiResponse(
            success=True,
            data={"models": models}
        )
    except Exception as e:
        print(f"Error listing models: {str(e)}")
        return ApiResponse(
            success=False,
            data={"models": []},
            error=str(e)
        )

@app.post("/chat")
async def chat(message: ChatMessage) -> ApiResponse:
    """Process a non-streaming chat message"""
    try:
        start_time = time.time()
        
        # Extract user profile from context if available
        user_profile = message.context.get("user_profile", {}) if message.context else {}
        
        # Call the AI orchestrator
        response = await orchestrator.process_query(
            query=message.message,  # Use message field, not content
            user_profile=user_profile
        )
        
        processing_time = time.time() - start_time
        
        # Return structured response
        return ApiResponse(
            success=True,
            data={
                "response": response.content,
                "source_agents": response.metadata.get("agents_used", []),
                "processing_time_seconds": round(processing_time, 2),
                "message_id": response.metadata.get("message_id", "")
            }
        )
    except Exception as e:
        logging.error(f"Error processing chat: {str(e)}")
        return ApiResponse(
            success=False,
            data={},
            error=str(e)
        )

@app.post("/chat/stream")
async def stream_chat(message: ChatMessage):
    """Process a streaming chat message with SSE response"""
    
    async def event_generator():
        try:
            # Extract user profile from context if available
            user_profile = message.context.get("user_profile", {}) if message.context else {}
            
            # Send start event
            yield f"data: {json.dumps({'event': 'start', 'query': message.message})}\n\n"
            
            # Call the AI orchestrator with streaming enabled
            async for token in orchestrator.stream_query(
                query=message.message,  # Use message field, not content
                user_profile=user_profile
            ):
                # Format as SSE event with the token
                if token.strip():  # Only send non-empty tokens
                    yield f"data: {json.dumps({'token': token})}\n\n"
                    
                    # Small delay to prevent overwhelming the client
                    await asyncio.sleep(0.001)
                
            # End of stream
            yield f"data: {json.dumps({'event': 'end', 'done': True})}\n\n"
            
        except Exception as e:
            print(f"Error in stream: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
            yield f"data: {json.dumps({'event': 'end', 'done': True})}\n\n"
    
    return StreamingResponse(
        event_generator(), 
        media_type="text/event-stream",
        headers={
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',  # Disable buffering in Nginx
        }
    )

@app.post("/health/query")
async def health_query(query: HealthQuery) -> ApiResponse:
    """Process a health-specific query"""
    try:
        start_time = time.time()
        
        # Call the AI orchestrator
        response = await orchestrator.process_query(
            query=query.query,
            user_profile=query.user_profile or {}
        )
        
        processing_time = time.time() - start_time
        
        result = {
            "response": response.content,
            "processing_time_seconds": round(processing_time, 2),
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Include sources if requested
        if query.include_sources:
            result["source_agents"] = response.metadata.get("agents_used", [])
            
        return ApiResponse(
            success=True,
            data=result
        )
    except Exception as e:
        logging.error(f"Error processing health query: {str(e)}")
        return ApiResponse(
            success=False,
            data={},
            error=str(e)
        )

if __name__ == "__main__":
    # This block is used when running the script directly
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
