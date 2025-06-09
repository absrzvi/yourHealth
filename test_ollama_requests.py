#!/usr/bin/env python
"""
Ollama Streaming Test using requests library
Shows real-time output as it's being generated
"""
import sys
import time
import json

try:
    import requests
    print("✅ Found requests library")
except ImportError:
    print("❌ requests library not found")
    print("Installing requests...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
    import requests
    print("✅ Installed requests successfully")

def test_ollama_requests(timeout=120):
    """Test Ollama with requests library for better streaming support"""
    print("===== Ollama Requests Streaming Test =====")
    print(f"Timeout set to {timeout} seconds")
    
    # Configuration
    host = "http://localhost:11434"
    model = "llama3.2:latest"  # Using llama for better responses
    fallback_model = "phi3:mini"
    
    # First check connection and available models
    try:
        print(f"Testing connection to Ollama at {host}...")
        response = requests.get(f"{host}/api/tags", timeout=10)
        
        if response.status_code != 200:
            print(f"❌ Failed to connect: HTTP {response.status_code}")
            return
            
        print("✅ Successfully connected to Ollama")
        
        # Get available models
        data = response.json()
        models = [model.get("name") for model in data.get("models", [])]
        print(f"Available models: {models}")
        
        # Verify our model is available
        if model not in models:
            print(f"⚠️ {model} not available, using fallback")
            if fallback_model in models:
                model = fallback_model
            elif len(models) > 0:
                model = models[0]
            else:
                print("❌ No models available")
                return
        
        # Prompt for testing
        prompt = "What are three important biomarkers for heart health? Provide a brief explanation for each."
        
        print(f"\nSending streaming request to {model}...")
        print(f"Prompt: {prompt}")
        print("\nResponse:")
        print("----------")
        
        # Prepare streaming request
        headers = {"Content-Type": "application/json"}
        data = {
            "model": model,
            "prompt": prompt,
            "stream": True,
            "options": {
                "temperature": 0.7,
                "num_predict": 200  # Limit response length for faster results
            }
        }
        
        # Start timing
        start_time = time.time()
        
        # Send streaming request
        with requests.post(
            f"{host}/api/generate", 
            json=data,
            headers=headers,
            stream=True,  # Important: Enable streaming!
            timeout=timeout
        ) as response:
            
            if response.status_code != 200:
                print(f"❌ Error: HTTP {response.status_code}")
                print(f"Error details: {response.text}")
                return
                
            # Process the streaming response
            full_response = ""
            
            # Iterate through the response stream
            for line in response.iter_lines():
                if line:
                    # Decode and parse the JSON
                    try:
                        data = json.loads(line.decode('utf-8'))
                        
                        # Extract text chunk
                        if 'response' in data:
                            text_chunk = data['response']
                            full_response += text_chunk
                            print(text_chunk, end='', flush=True)
                            
                        # Check if done
                        if data.get('done', False):
                            break
                            
                    except json.JSONDecodeError as e:
                        print(f"\nError parsing JSON: {str(e)}")
                        continue
            
            # Show completion stats
            elapsed = time.time() - start_time
            print("\n----------")
            print(f"✅ Generation completed in {elapsed:.2f} seconds")
            print(f"Total length: {len(full_response)} characters")
            
    except requests.exceptions.ConnectionError:
        print("\n❌ Connection error. Is Ollama running?")
    except requests.exceptions.Timeout:
        print("\n❌ Request timed out")
    except KeyboardInterrupt:
        print("\n\n❌ Aborted by user")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")

if __name__ == "__main__":
    # Parse command line args for timeout
    timeout = 120  # Default
    if len(sys.argv) > 1:
        try:
            timeout = int(sys.argv[1])
        except ValueError:
            pass
            
    test_ollama_requests(timeout)
