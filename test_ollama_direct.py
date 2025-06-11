#!/usr/bin/env python
"""
Minimal Ollama Test Script
Direct HTTP connection with timeout handling
"""
import http.client
import json
import time
import sys

def test_ollama_direct(timeout=60):
    """
    Direct test of Ollama without any agent overhead
    Implements timeout and progress updates
    """
    print("===== Simple Ollama Direct Test =====")
    print(f"Timeout set to {timeout} seconds")
    
    # Configuration
    host = "localhost"
    port = 11434
    model = "phi3:mini"  # Using the smaller model first
    fallback_model = "llama3.2:latest"
    
    # Simple prompt
    prompt = "What are three important biomarkers for heart health?"
    
    print(f"Testing connection to Ollama ({host}:{port})...")
    try:
        # Try to connect
        conn = http.client.HTTPConnection(host, port, timeout=10)
        conn.request("GET", "/api/tags")
        response = conn.getresponse()
        
        if response.status != 200:
            print(f"❌ Failed to connect: HTTP {response.status}")
            return
        
        print("✅ Successfully connected to Ollama")
        
        # Get available models
        data = json.loads(response.read().decode())
        models = [model.get("name") for model in data.get("models", [])]
        print(f"Available models: {models}")
        
        # Choose model
        if model not in models and fallback_model in models:
            print(f"⚠️ {model} not found, using {fallback_model} instead")
            model = fallback_model
        elif model not in models and fallback_model not in models:
            print(f"❌ Neither {model} nor {fallback_model} found")
            return
            
        # Prepare request
        print(f"Sending request to {model}...")
        print(f"Prompt: {prompt}")
        
        body = json.dumps({
            "model": model,
            "prompt": prompt,
            "stream": False
        })
        
        headers = {"Content-Type": "application/json"}
        start_time = time.time()
        
        # Make request
        conn = http.client.HTTPConnection(host, port, timeout=timeout)
        conn.request("POST", "/api/generate", body, headers)
        
        # Monitor for timeout
        print(f"Waiting for response (timeout: {timeout}s)")
        
        # Print dots to show activity
        elapsed = 0
        while elapsed < timeout:
            sys.stdout.write(".")
            sys.stdout.flush()
            time.sleep(2)
            elapsed = time.time() - start_time
            
            # Try to get response if ready
            try:
                response = conn.getresponse()
                # If we get here, response is ready
                break
            except http.client.ResponseNotReady:
                # Not ready yet, continue waiting
                continue
                
        # Check if we timed out
        if elapsed >= timeout:
            print("\n❌ Request timed out")
            return
            
        # Process response
        if response.status == 200:
            data = json.loads(response.read().decode())
            response_text = data.get("response", "")
            response_time = time.time() - start_time
            
            print(f"\n✅ Response received in {response_time:.2f} seconds")
            print("\n--- Response ---")
            print(response_text[:500])  # Print first 500 chars
            print("---------------")
        else:
            print(f"\n❌ Error: HTTP {response.status}")
            try:
                error = response.read().decode()
                print(f"Error details: {error}")
            except:
                pass
    
    except ConnectionRefusedError:
        print("❌ Connection refused. Is Ollama running?")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    # Default timeout
    timeout = 60
    
    # Check for command line argument for timeout
    if len(sys.argv) > 1:
        try:
            timeout = int(sys.argv[1])
        except:
            print(f"Invalid timeout value. Using default: {timeout}s")
    
    test_ollama_direct(timeout)
