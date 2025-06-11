"""
Simple test script to verify Ollama connection
"""
import sys
import json
import http.client
import time

def test_ollama_connection():
    """Test basic connection to Ollama server"""
    print("Testing connection to Ollama server...")
    
    try:
        # Connect to Ollama server (default port is 11434)
        conn = http.client.HTTPConnection("localhost", 11434)
        
        # Check if server is responsive
        conn.request("GET", "/")
        response = conn.getresponse()
        
        if response.status == 200:
            print(f"✅ Successfully connected to Ollama server (Status: {response.status})")
        else:
            print(f"❌ Connected but received unexpected status code: {response.status}")
            print(f"Response: {response.read().decode()}")
            
        # List available models
        print("\nFetching available models...")
        conn = http.client.HTTPConnection("localhost", 11434)
        conn.request("GET", "/api/tags")
        response = conn.getresponse()
        
        if response.status == 200:
            models_data = json.loads(response.read().decode())
            models = models_data.get("models", [])
            
            if models:
                print(f"✅ Found {len(models)} models:")
                for model in models:
                    name = model.get("name", "Unknown")
                    print(f"  - {name}")
                    
                # Check if llama3.2 is available
                llama_models = [m for m in models if "llama3" in m.get("name", "").lower()]
                if llama_models:
                    print("\n✅ Llama3 models detected! You can proceed with the health assistant.")
                else:
                    print("\n⚠️ No Llama3 models detected. You may need to run: ollama pull llama3.2:latest")
            else:
                print("❌ No models found. You may need to pull models using: ollama pull llama3.2:latest")
        else:
            print(f"❌ Failed to fetch models. Status: {response.status}")
            print(f"Response: {response.read().decode()}")
        
        return True
        
    except ConnectionRefusedError:
        print("❌ Connection refused. Is Ollama running? Make sure to start the Ollama server.")
        return False
    except Exception as e:
        print(f"❌ Error connecting to Ollama: {str(e)}")
        return False
        
def test_simple_generation():
    """Test a simple text generation with Ollama"""
    print("\nTesting simple text generation...")
    
    try:
        # Connect to Ollama API
        conn = http.client.HTTPConnection("localhost", 11434)
        
        # Prepare a simple generation request
        headers = {'Content-Type': 'application/json'}
        body = json.dumps({
            "model": "llama3.2:latest",  # Change this if you're using a different model
            "prompt": "What are the health benefits of regular exercise?",
            "stream": False
        })
        
        # Send the request
        print("Sending request to Ollama... (this might take a few seconds)")
        start_time = time.time()
        conn.request("POST", "/api/generate", body, headers)
        
        # Get response
        response = conn.getresponse()
        end_time = time.time()
        
        if response.status == 200:
            response_data = json.loads(response.read().decode())
            generated_text = response_data.get("response", "")
            
            print(f"✅ Successfully generated text in {end_time - start_time:.2f} seconds")
            print("\n--- Generated Response ---")
            print(f"{generated_text[:300]}...")  # Print first 300 chars
            print("------------------------")
            return True
        else:
            print(f"❌ Generation failed. Status: {response.status}")
            print(f"Response: {response.read().decode()}")
            return False
            
    except Exception as e:
        print(f"❌ Error during text generation: {str(e)}")
        return False

if __name__ == "__main__":
    print("==== Ollama Connection Test ====")
    
    if test_ollama_connection():
        # If connection successful, try a simple generation
        test_simple_generation()
    
    print("\n==== Test Complete ====")
