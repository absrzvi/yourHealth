"""
Local LLM Integration with Ollama for HIPAA-compliant Health AI Assistant
Provides local-only LLM inference with no external API dependencies
"""
import ollama
from typing import List, Dict, Any, Optional, Generator, Union
import json
import asyncio
import logging
from datetime import datetime
import time
import os

class LocalHealthLLM:
    """
    Local Health LLM using Ollama for HIPAA compliance
    
    Handles prompt engineering, context integration, and LLM generation
    All inference happens locally, ensuring no PHI leaves the system
    """
    def __init__(self, 
                 model_name: str = "llama3.2:latest", 
                 fallback_model: str = "phi3:mini",
                 logging_level: int = logging.INFO):
        """
        Initialize Local LLM with Ollama
        
        Args:
            model_name: Primary Ollama model to use
            fallback_model: Fallback model if primary fails
            logging_level: Logging verbosity level
        """
        self.logger = logging.getLogger(__name__)
        self.logger.setLevel(logging_level)
        
        if not self.logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
            handler.setFormatter(formatter)
            self.logger.addHandler(handler)
            
        self.model_name = model_name
        self.fallback_model = fallback_model
        self.logger.info(f"LocalHealthLLM initialized with model: {model_name}, fallback: {fallback_model}")
        
        # Test connection to Ollama
        self._test_ollama_connection()
    
    def _test_ollama_connection(self):
        """Test connection to Ollama service"""
        try:
            # List available models
            models = ollama.list()
            available_models = [model.get('name') for model in models.get('models', [])]
            
            self.logger.info(f"Available Ollama models: {available_models}")
            
            # Check if our models are available
            if self.model_name not in available_models:
                self.logger.warning(f"Primary model {self.model_name} not found in Ollama")
                if self.fallback_model in available_models:
                    self.logger.info(f"Will use fallback model {self.fallback_model}")
                else:
                    self.logger.error(f"Neither primary nor fallback model available")
                    self.logger.info("Please run: ollama pull llama3.2:latest")
        except Exception as e:
            self.logger.error(f"Ollama connection failed: {e}")
            self.logger.info("Please ensure Ollama service is running")
    
    def create_health_prompt(self, 
                           query: str, 
                           context: List[Dict],
                           user_profile: Dict) -> str:
        """
        Create optimized prompt for health analysis
        
        Args:
            query: User query
            context: Retrieved context documents
            user_profile: User demographic and health information
            
        Returns:
            Formatted prompt for LLM
        """
        prompt = f"""You are an expert health AI assistant analyzing personal health data. 
You must provide accurate, evidence-based insights while being clear about limitations.

User Profile:
- Age: {user_profile.get('age', 'Unknown')}
- Sex: {user_profile.get('sex', 'Unknown')}
- Health Goals: {user_profile.get('goals', 'General wellness')}

Context Information:
"""

        # Add retrieved context
        for i, doc in enumerate(context):
            prompt += f"\n--- Document {i+1} ---\n"
            prompt += f"Type: {doc.get('metadata', {}).get('data_type', 'Unknown')}\n"
            prompt += f"{doc.get('content', 'No content')}\n"

        # Add user query
        prompt += f"\n\nUser Question: {query}\n\n"
        
        prompt += """Please provide:
1. Direct answer to the question
2. Relevant health insights from the data
3. Any important correlations or patterns
4. Actionable recommendations
5. Any limitations or caveats

Response:"""
        
        return prompt
    
    def generate_response(self,
                         query: str,
                         context: List[Dict],
                         user_profile: Dict,
                         stream: bool = False) -> Union[str, Generator]:
        """
        Generate LLM response for health query
        
        Args:
            query: User query
            context: Retrieved context documents
            user_profile: User profile information
            stream: Whether to stream response
            
        Returns:
            LLM response as string or stream
        """
        # Create optimized prompt
        prompt = self.create_health_prompt(query, context, user_profile)
        
        model_to_use = self.model_name
        max_retries = 2
        retry_count = 0
        
        while retry_count <= max_retries:
            try:
                start_time = time.time()
                self.logger.info(f"Generating response using {model_to_use}")
                
                # Handle streaming vs. non-streaming
                if stream:
                    response_generator = ollama.generate(
                        model=model_to_use,
                        prompt=prompt,
                        stream=True,
                        options={
                            'temperature': 0.7,
                            'top_p': 0.9,
                            'top_k': 40,
                            'num_predict': 512
                        }
                    )
                    return self._stream_response(response_generator)
                else:
                    response = ollama.generate(
                        model=model_to_use,
                        prompt=prompt,
                        options={
                            'temperature': 0.7,
                            'top_p': 0.9,
                            'top_k': 40,
                            'num_predict': 512
                        }
                    )
                    
                    elapsed_time = time.time() - start_time
                    self.logger.info(f"Response generated in {elapsed_time:.2f}s")
                    return response['response']
                
            except Exception as e:
                self.logger.error(f"LLM generation error with {model_to_use}: {e}")
                retry_count += 1
                
                # Try fallback model if primary fails
                if model_to_use == self.model_name and self.fallback_model:
                    self.logger.info(f"Trying fallback model: {self.fallback_model}")
                    model_to_use = self.fallback_model
                else:
                    if retry_count <= max_retries:
                        self.logger.info(f"Retrying... (attempt {retry_count}/{max_retries})")
                        time.sleep(2)  # Brief pause before retry
                    else:
                        error_msg = f"Failed to generate response after {max_retries} retries"
                        self.logger.error(error_msg)
                        raise RuntimeError(error_msg)
    
    def _stream_response(self, response_generator):
        """
        Handle streaming responses
        
        Args:
            response_generator: Ollama streaming generator
            
        Yields:
            Text chunks as they become available
        """
        for chunk in response_generator:
            if 'response' in chunk:
                yield chunk['response']
    
    def analyze_correlations(self, health_data: Dict) -> Dict:
        """
        Use LLM to find health correlations
        
        Args:
            health_data: Dictionary of health metrics
            
        Returns:
            Dictionary of correlations and insights
        """
        prompt = f"""Analyze these health metrics for correlations and patterns:

DNA Data: {json.dumps(health_data.get('dna', {}), indent=2)}
Microbiome: {json.dumps(health_data.get('microbiome', {}), indent=2)}
Biomarkers: {json.dumps(health_data.get('biomarkers', {}), indent=2)}

Identify:
1. Correlations between biomarkers
2. Genetic factors affecting biomarker levels
3. Microbiome impacts on health metrics
4. Potential health insights
5. Suggested lifestyle modifications

Provide your analysis in JSON format with these keys:
- correlations: array of correlation objects
- insights: array of health insights
- recommendations: array of actionable recommendations
"""

        try:
            response = ollama.generate(
                model=self.model_name,
                prompt=prompt,
                options={
                    'temperature': 0.3,  # Lower temperature for more factual analysis
                    'top_p': 0.9,
                    'top_k': 40
                }
            )
            
            # Extract JSON from response
            response_text = response['response']
            # Find JSON content between triple backticks if present
            json_text = response_text
            if "```json" in response_text:
                json_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                json_text = response_text.split("```")[1].split("```")[0].strip()
                
            try:
                # Parse JSON response
                return json.loads(json_text)
            except json.JSONDecodeError as e:
                self.logger.error(f"Failed to parse JSON from response: {e}")
                # Return raw text if JSON parsing failed
                return {
                    "correlations": [],
                    "insights": [{"text": response_text}],
                    "recommendations": []
                }
                
        except Exception as e:
            self.logger.error(f"Error analyzing correlations: {e}")
            return {
                "correlations": [],
                "insights": [],
                "recommendations": [],
                "error": str(e)
            }
