#!/usr/bin/env python
"""
Test script using the official Ollama Python client
This should be more reliable than custom HTTP implementations
"""
import sys
import time
from datetime import datetime

try:
    import ollama
except ImportError:
    print("The ollama package is not installed.")
    print("Please install it with: pip install ollama")
    sys.exit(1)

def test_ollama_official(model="phi3:mini", timeout=60):
    """Test Ollama using the official Python client"""
    print("===== Testing Ollama with Official Client =====")
    print(f"Using model: {model}")
    print(f"Timeout: {timeout} seconds")
    
    try:
        # Test connection by listing models
        print("\nListing available models...")
        start_time = time.time()
        models = ollama.list()
        print(f"Available models: {[m['name'] for m in models['models']]}")
        
        # Simple prompt
        prompt = "What are three important biomarkers for heart health? Keep your answer short and concise."
        print(f"\nPrompt: {prompt}")
        
        # Generate response with timeout monitoring
        print(f"Generating response (max wait: {timeout}s)...")
        start_time = time.time()
        
        try:
            # Set up the request with a reduced context window for faster response
            response = ollama.generate(
                model=model,
                prompt=prompt,
                options={
                    "temperature": 0.5,
                    "num_ctx": 512,  # Reduced context window
                    "num_predict": 100,  # Limit response length
                    "stop": ["</answer>"]  # Optional stop token
                }
            )
            
            # Calculate time
            elapsed = time.time() - start_time
            print(f"\n✅ Response received in {elapsed:.2f} seconds")
            
            # Print response
            print("\n--- Response ---")
            print(response['response'])
            print("---------------")
            
            # Print stats
            if 'eval_count' in response:
                print(f"\nTokens generated: {response['eval_count']}")
            if 'prompt_eval_count' in response:  
                print(f"Prompt tokens: {response['prompt_eval_count']}")
            if 'total_duration' in response:
                print(f"Total duration: {response['total_duration']/1000000000:.2f} seconds")
            
            return response
            
        except Exception as e:
            print(f"\n❌ Error generating response: {str(e)}")
            return None
            
    except Exception as e:
        print(f"\n❌ Error connecting to Ollama: {str(e)}")
        return None

if __name__ == "__main__":
    # Parse command line arguments
    model = "phi3:mini"  # Default model
    timeout = 60  # Default timeout
    
    if len(sys.argv) > 1:
        model = sys.argv[1]
    if len(sys.argv) > 2:
        try:
            timeout = int(sys.argv[2])
        except:
            print(f"Invalid timeout value. Using default: {timeout}s")
    
    test_ollama_official(model, timeout)
