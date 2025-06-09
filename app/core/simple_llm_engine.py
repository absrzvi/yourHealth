"""
Simplified LLM Engine for local Ollama integration
Uses direct HTTP requests without requiring external libraries
"""
import json
import http.client
import time
import asyncio
from typing import Dict, Any, List, Optional, Union, AsyncGenerator
from datetime import datetime

class SimpleOllamaEngine:
    """
    Lightweight LLM engine that connects directly to local Ollama
    Designed to work without requiring complex dependencies
    """
    
    def __init__(self, 
                 model_name: str = "llama3.2:latest", 
                 fallback_model: str = "phi3:mini",
                 host: str = "localhost",
                 port: int = 11434):
        self.model_name = model_name
        self.fallback_model = fallback_model
        self.host = host
        self.port = port
        print(f"Initialized SimpleOllamaEngine with model: {model_name}")
    
    def generate_response(self, 
                         query: str, 
                         context: List[Dict] = None, 
                         user_profile: Dict = None,
                         temperature: float = 0.7,
                         max_tokens: int = 2048,
                         timeout: int = 120) -> str:
        """
        Generate a response from the local Ollama model
        
        Args:
            query: The user's question or prompt
            context: Optional list of context documents
            user_profile: Optional user profile information
            temperature: Controls randomness (higher = more creative)
            max_tokens: Maximum output token count
            timeout: Maximum time to wait for response in seconds
            
        Returns:
            Generated text response
        """
        try:
            # Create a formatted prompt with context and user profile
            full_prompt = self._create_prompt(query, context, user_profile)
            
            # Prepare the API request to Ollama
            conn = http.client.HTTPConnection(self.host, self.port, timeout=timeout)
            
            # Prepare request body with options
            body = json.dumps({
                "model": self.model_name,
                "prompt": full_prompt,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                },
                "stream": False
            })
            
            # Make request
            headers = {"Content-Type": "application/json"}
            print(f"Sending request to Ollama ({self.model_name})...")
            print(f"Timeout set to {timeout} seconds. This may take a while...")
            start_time = time.time()
            conn.request("POST", "/api/generate", body, headers)
            
            # Print progress updates during long-running operations
            progress_interval = 10  # seconds between progress updates
            last_update = start_time
            
            # Get response with timeout monitoring
            while True:
                elapsed = time.time() - start_time
                if elapsed > timeout:
                    conn.close()
                    return f"Error: Request timed out after {timeout} seconds"
                    
                # Print progress update every interval
                if time.time() - last_update > progress_interval:
                    print(f"Still waiting for response... ({int(elapsed)} seconds elapsed)")
                    last_update = time.time()
                
                # Check if response is ready
                try:
                    response = conn.getresponse()
                    break
                except http.client.ResponseNotReady:
                    # Wait a bit and try again
                    time.sleep(1)
                    continue
                    
            # Process the response
            response_time = time.time() - start_time
            
            if response.status == 200:
                try:
                    data = json.loads(response.read().decode())
                    print(f"Response generated in {response_time:.2f} seconds")
                    return data.get("response", "")
                except json.JSONDecodeError as e:
                    return f"Error: Invalid response from Ollama: {str(e)}"
            else:
                error_msg = f"Error: HTTP {response.status}"
                try:
                    error_detail = response.read().decode()
                    error_msg += f" - {error_detail}"
                except:
                    pass
                    
                # Try fallback model if main model fails
                if self.model_name != self.fallback_model:
                    print(f"Failed to generate with {self.model_name}, trying fallback {self.fallback_model}")
                    original_model = self.model_name
                    self.model_name = self.fallback_model
                    result = self.generate_response(query, context, user_profile, temperature, max_tokens, timeout)
                    self.model_name = original_model
                    return result
                else:
                    return f"Error generating response: {error_msg}"
        
        except TimeoutError:
            return f"Error: Connection to Ollama timed out after {timeout} seconds"
        except ConnectionRefusedError:
            return "Error: Connection refused. Is Ollama running on localhost:11434?"
        except Exception as e:
            print(f"Exception during generation: {str(e)}")
            return f"Error: {str(e)}"
    
    def _create_prompt(self, 
                      query: str, 
                      context: List[Dict] = None, 
                      user_profile: Dict = None) -> str:
        """
        Create a well-formatted prompt with context and user profile
        
        Args:
            query: The user's question
            context: List of context dictionaries with content
            user_profile: User profile information
            
        Returns:
            Formatted prompt string
        """
        # Start with a system instruction
        prompt = "You are a helpful health assistant that provides accurate information based on scientific evidence.\n\n"
        
        # Add user profile if available
        if user_profile and isinstance(user_profile, dict) and len(user_profile) > 0:
            prompt += "User Profile:\n"
            for key, value in user_profile.items():
                prompt += f"- {key}: {value}\n"
            prompt += "\n"
        
        # Add context information if available
        if context and isinstance(context, list) and len(context) > 0:
            prompt += "Context Information:\n"
            for item in context:
                if isinstance(item, dict) and "content" in item:
                    prompt += f"- {item['content']}\n"
                elif isinstance(item, str):
                    prompt += f"- {item}\n"
            prompt += "\n"
        
        # Add the user query
        prompt += f"User Question: {query}\n\n"
        prompt += "Please provide a helpful, accurate, and detailed response:"
        
        return prompt
    
    async def stream_response(self, 
                        query: str, 
                        context: List[Dict] = None, 
                        user_profile: Dict = None,
                        temperature: float = 0.7,
                        max_tokens: int = 2048,
                        timeout: int = 120) -> AsyncGenerator[str, None]:
        """
        Generate a streaming response from the local Ollama model
        
        Args:
            query: The user's question or prompt
            context: Optional list of context documents
            user_profile: Optional user profile information
            temperature: Controls randomness (higher = more creative)
            max_tokens: Maximum output token count
            timeout: Maximum time to wait for response in seconds
            
        Yields:
            Token chunks as they are generated
        """
        try:
            # Create a formatted prompt with context and user profile
            full_prompt = self._create_prompt(query, context, user_profile)
            
            # Prepare the API request to Ollama
            conn = http.client.HTTPConnection(self.host, self.port, timeout=timeout)
            
            # Prepare request body with options
            body = json.dumps({
                "model": self.model_name,
                "prompt": full_prompt,
                "options": {
                    "temperature": temperature,
                    "num_predict": max_tokens
                },
                "stream": True  # Enable streaming
            })
            
            # Make request
            headers = {"Content-Type": "application/json"}
            print(f"Sending streaming request to Ollama ({self.model_name})...")
            print(f"Timeout set to {timeout} seconds.")
            start_time = time.time()
            conn.request("POST", "/api/generate", body, headers)
            
            # Get response
            response = conn.getresponse()
            
            if response.status != 200:
                error_msg = f"Error: HTTP {response.status}"
                try:
                    error_detail = response.read().decode()
                    error_msg += f" - {error_detail}"
                except:
                    pass
                yield error_msg
                return
                
            # Process streaming response
            buffer = b''
            
            while True:
                chunk = response.read(1)
                if not chunk:
                    # End of response
                    break
                    
                buffer += chunk
                
                # Check if we have a complete line (JSON object)
                if chunk == b'\n' and buffer.strip():
                    try:
                        # Parse the JSON data
                        data = json.loads(buffer.decode().strip())
                        
                        # Extract and yield the token
                        if 'response' in data:
                            yield data['response']
                            
                        # Check if done
                        if data.get('done', False):
                            break
                            
                    except json.JSONDecodeError:
                        # Incomplete JSON, continue buffering
                        pass
                    except Exception as e:
                        yield f"Error parsing stream: {str(e)}"
                        break
                        
                    # Reset buffer for next JSON object
                    buffer = b''
                    
                # Safety check for very long lines that might be malformed
                if len(buffer) > 100000:  # 100KB limit for a line
                    yield "Error: Received excessively long line from Ollama"
                    buffer = b''
                    
            response_time = time.time() - start_time
            print(f"Streaming completed in {response_time:.2f} seconds")
            
        except TimeoutError:
            yield f"Error: Connection to Ollama timed out after {timeout} seconds"
        except ConnectionRefusedError:
            yield "Error: Connection refused. Is Ollama running on localhost:11434?"
        except Exception as e:
            print(f"Exception during streaming: {str(e)}")
            yield f"Error: {str(e)}"
            
    async def list_models(self) -> List[str]:
        """
        Async version to get a list of available models from Ollama
        
        Returns:
            List of model names
        """
        # Execute synchronous method in a thread to make it async-compatible
        return await asyncio.to_thread(self.get_available_models)
    
    def get_available_models(self) -> List[str]:
        """
        Get a list of available models from Ollama
        
        Returns:
            List of model names
        """
        try:
            conn = http.client.HTTPConnection(self.host, self.port)
            conn.request("GET", "/api/tags")
            response = conn.getresponse()
            
            if response.status == 200:
                data = json.loads(response.read().decode())
                models = data.get("models", [])
                return [model.get("name", "unknown") for model in models]
            else:
                return []
                
        except Exception as e:
            print(f"Error getting models: {str(e)}")
            return []
