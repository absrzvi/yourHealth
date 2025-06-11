"""
Run script for FastAPI server that connects local Ollama models to the frontend.
This creates a bridge between the Next.js frontend and our local AI agents.
"""
import os
import uvicorn

def main():
    """Run the FastAPI API server"""
    # Import here to handle automatic dependency installation
    from app.core.api_server import app
    
    # Get port from environment or use default
    port = int(os.environ.get("API_PORT", 8000))
    
    print(f"=== Starting Health AI API Server on port {port} ===")
    print("Access the API documentation at: http://localhost:8000/docs")
    print("Press Ctrl+C to exit")
    
    # Run the server
    uvicorn.run(
        "app.core.api_server:app", 
        host="0.0.0.0", 
        port=port, 
        reload=True  # Enable auto-reload during development
    )

if __name__ == "__main__":
    main()
