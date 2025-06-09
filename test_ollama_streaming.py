#!/usr/bin/env python
"""
Ollama Streaming Test
Shows real-time output as it's being generated
"""
import json
import http.client
import time
import sys

def test_ollama_streaming(timeout=120):
    """Test Ollama with streaming enabled to see output as it's generated"""
    print("===== Ollama Streaming Test =====")
    print(f"Timeout set to {timeout} seconds")
    
    # Configuration
    host = "localhost"
    port = 11434
    model = "llama3.2:latest"  # Using llama for better quality responses
    
    # Simple prompt
    prompt = "What are three important biomarkers for heart health? Provide a brief explanation for each."
    
    try:
        # Test connection
        print(f"Testing connection to Ollama ({host}:{port})...")
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
        
        if model not in models:
            print(f"⚠️ Model {model} not found!")
            if len(models) > 0:
                model = models[0]
                print(f"Using {model} instead")
            else:
                print("❌ No models available")
                return
        
        # Prepare streaming request
        print(f"\nSending streaming request to {model}...")
        print(f"Prompt: {prompt}")
        
        body = json.dumps({
            "model": model,
            "prompt": prompt,
            "stream": True,  # Enable streaming!
            "options": {
                "temperature": 0.7,
                "num_predict": 200  # Limit response length for faster results
            }
        })
        
        headers = {"Content-Type": "application/json"}
        
        # Make request
        print("\nResponse:")
        print("----------")
        
        start_time = time.time()
        conn = http.client.HTTPConnection(host, port, timeout=timeout)
        conn.request("POST", "/api/generate", body, headers)
        
        response = conn.getresponse()
        if response.status != 200:
            print(f"❌ Error: HTTP {response.status}")
            try:
                error = response.read().decode()
                print(f"Error details: {error}")
            except:
                pass
            return
            
        # Process streaming response
        full_response = ""
        line_buffer = ""
        
        print("Waiting for first tokens... ", end="", flush=True)
        
        while True:
            # Check timeout
            if time.time() - start_time > timeout:
                print("\n\n❌ Timeout reached")
                break
                
            # Read next line from the streaming response
            # Ollama sends each chunk as a complete JSON object on a single line
            chunk = response.readline()
            
            if not chunk:
                # End of response
                break
                
            # Decode the chunk
            try:
                line = chunk.decode('utf-8').strip()
                if not line:
                    continue
                    
                # Parse the JSON response
                data = json.loads(line)
                
                # Extract the piece of generated text
                if 'response' in data:
                    text_chunk = data['response']
                    full_response += text_chunk
                    print(text_chunk, end='', flush=True)  # Print in real-time
                
                # Check if done
                if data.get('done', False):
                    break
                    
            except json.JSONDecodeError as e:
                print(f"\nError parsing JSON: {str(e)}\nLine: {line}\n")
                continue
            except Exception as e:
                print(f"\nError processing chunk: {str(e)}")
                continue
                
        # Display completion information
        elapsed = time.time() - start_time
        print("\n----------")
        print(f"✅ Generation completed in {elapsed:.2f} seconds")
        print(f"Total length: {len(full_response)} characters")
        
    except KeyboardInterrupt:
        print("\n\n❌ Aborted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {str(e)}")

if __name__ == "__main__":
    # Parse command line args
    timeout = 120  # Default timeout
    if len(sys.argv) > 1:
        try:
            timeout = int(sys.argv[1])
        except:
            pass
    
    test_ollama_streaming(timeout)
