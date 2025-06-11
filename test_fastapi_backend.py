"""
Test script for the FastAPI backend server integration with Ollama.
This verifies both streaming and non-streaming endpoints are working properly.
"""
import asyncio
import json
import requests
import time
from typing import Dict, Any, List

# Configuration
API_URL = "http://localhost:8000"  # FastAPI server URL
TEST_QUERY = "What are the most important biomarkers for heart health?"
TEST_PROFILE = {"age": 35, "health_conditions": ["high blood pressure"], "medications": ["lisinopril"]}

def test_health_endpoint():
    """Test the health endpoint to verify the server is running"""
    print("\n=== Testing Health Endpoint ===")
    try:
        response = requests.get(f"{API_URL}/")
        response.raise_for_status()
        print(f"✅ Health check response: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {str(e)}")
        return False
        
def test_models_endpoint():
    """Test the models endpoint to verify Ollama connection"""
    print("\n=== Testing Models Endpoint ===")
    try:
        response = requests.get(f"{API_URL}/models")
        response.raise_for_status()
        data = response.json()
        models = data.get("data", {}).get("models", [])
        print(f"✅ Available models: {models}")
        return True
    except Exception as e:
        print(f"❌ Models endpoint failed: {str(e)}")
        return False
        
def test_chat_endpoint():
    """Test the non-streaming chat endpoint"""
    print("\n=== Testing Chat Endpoint ===")
    try:
        payload = {
            "message": TEST_QUERY,
            "context": {
                "user_profile": TEST_PROFILE
            }
        }
        print(f"Sending query: {TEST_QUERY}")
        start_time = time.time()
        response = requests.post(f"{API_URL}/chat", json=payload)
        response.raise_for_status()
        
        result = response.json()
        elapsed = time.time() - start_time
        
        print(f"✅ Response received in {elapsed:.2f} seconds")
        print(f"Response: {result.get('data', {}).get('response', '')[:100]}...")
        print(f"Source agents: {result.get('data', {}).get('source_agents', [])}")
        return True
    except Exception as e:
        print(f"❌ Chat endpoint failed: {str(e)}")
        return False
        
def test_streaming_endpoint():
    """Test the streaming chat endpoint"""
    print("\n=== Testing Streaming Chat Endpoint ===")
    try:
        payload = {
            "message": TEST_QUERY,
            "context": {
                "user_profile": TEST_PROFILE
            }
        }
        
        print(f"Sending streaming query: {TEST_QUERY}")
        start_time = time.time()
        
        # Using a session to manage streaming connection
        with requests.Session() as session:
            with session.post(f"{API_URL}/chat/stream", json=payload, stream=True) as response:
                response.raise_for_status()
                
                # Process streaming response
                complete_response = ""
                token_count = 0
                
                for line in response.iter_lines():
                    if not line:
                        continue
                        
                    # Remove 'data: ' prefix
                    if line.startswith(b'data: '):
                        line = line[6:]
                        
                    try:
                        data = json.loads(line)
                        
                        # Check if we got a token
                        if 'token' in data:
                            token = data['token']
                            print(token, end='', flush=True)
                            complete_response += token
                            token_count += 1
                            
                        # Check if streaming is done
                        if data.get('event') == 'end' or data.get('done'):
                            break
                            
                    except json.JSONDecodeError:
                        print(f"Error parsing: {line}")
        
        elapsed = time.time() - start_time
        print(f"\n\n✅ Streaming response completed in {elapsed:.2f} seconds")
        print(f"Received {token_count} tokens")
        return True
    except Exception as e:
        print(f"❌ Streaming endpoint failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("=== FastAPI Backend Test ===")
    print("This script tests the connection between the FastAPI server and Ollama models.")
    print("Make sure the server is running with 'python run_api_server.py'")
    
    # Run tests
    health_ok = test_health_endpoint()
    if not health_ok:
        print("\n❌ Health check failed! Make sure the server is running.")
        exit(1)
        
    models_ok = test_models_endpoint()
    if not models_ok:
        print("\n⚠️ Models endpoint failed! This could indicate Ollama connection issues.")
        
    chat_ok = test_chat_endpoint()
    if not chat_ok:
        print("\n⚠️ Chat endpoint failed! Check server logs for details.")
        
    streaming_ok = test_streaming_endpoint()
    if not streaming_ok:
        print("\n⚠️ Streaming endpoint failed! Check server logs for details.")
        
    # Summary
    print("\n=== Test Summary ===")
    print(f"Health Endpoint: {'✅ PASS' if health_ok else '❌ FAIL'}")
    print(f"Models Endpoint: {'✅ PASS' if models_ok else '❌ FAIL'}")
    print(f"Chat Endpoint: {'✅ PASS' if chat_ok else '❌ FAIL'}")
    print(f"Streaming Endpoint: {'✅ PASS' if streaming_ok else '❌ FAIL'}")
    
    if all([health_ok, models_ok, chat_ok, streaming_ok]):
        print("\n🎉 All tests passed! Backend API is ready for integration.")
    else:
        print("\n⚠️ Some tests failed. Review logs and fix issues.")
