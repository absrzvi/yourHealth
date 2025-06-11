"""
Simplified AI Agents for Health Assistant
Designed to work with local Ollama without requiring complex dependencies
"""
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Union, AsyncGenerator
import json
import asyncio
from datetime import datetime

from app.core.simple_llm_engine import SimpleOllamaEngine

class AgentRole(Enum):
    """Role-specific expert agents for health analysis"""
    DNA_ANALYST = "dna_analyst"
    MICROBIOME_EXPERT = "microbiome_expert"
    BIOMARKER_INTERPRETER = "biomarker_interpreter"
    CORRELATION_FINDER = "correlation_finder"
    RECOMMENDATION_ENGINE = "recommendation_engine"
    ORCHESTRATOR = "orchestrator"

@dataclass
class AgentMessage:
    """Message structure for agent communication"""
    role: AgentRole
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

class SimpleHealthAgent:
    """
    Simplified expert agent for a specific health domain
    (DNA, Microbiome, Biomarkers, etc.)
    """
    def __init__(self, role: AgentRole, llm_engine: SimpleOllamaEngine):
        self.role = role
        self.llm_engine = llm_engine
        self.system_prompt = self._default_prompt_template()
        print(f"Initialized {self.role.value} agent")
        
    def _default_prompt_template(self) -> str:
        """Role-specific detailed prompt templates"""
        templates = {
            AgentRole.DNA_ANALYST: """You are a genetic counselor AI. Analyze DNA data for:
- Disease risk variants
- Pharmacogenomic implications
- Actionable genetic insights
- Carrier status for hereditary conditions""",
            
            AgentRole.MICROBIOME_EXPERT: """You are a microbiome specialist AI. Analyze gut bacteria for:
- Dysbiosis patterns
- Metabolic implications
- Immune system impacts
- Dietary recommendations for microbiome optimization""",
            
            AgentRole.BIOMARKER_INTERPRETER: """You are a clinical laboratory AI. Interpret biomarkers for:
- Organ system function
- Nutritional status
- Inflammatory markers
- Metabolic health indicators""",
            
            AgentRole.CORRELATION_FINDER: """You are a systems biology AI. Find correlations between:
- Genetic variants and biomarker levels
- Microbiome composition and health markers
- Multi-omic patterns indicating health risks
- Synergistic effects across data types""",
            
            AgentRole.RECOMMENDATION_ENGINE: """You are a personalized medicine AI. Provide:
- Evidence-based lifestyle modifications
- Targeted supplementation strategies
- Dietary optimizations based on genetics and microbiome
- Monitoring recommendations for identified risks""",
        }
        return templates.get(self.role, "You are a health AI expert. Analyze the following data:")
    
    async def process(self, task: str, context: Dict) -> Dict[str, Any]:
        """Process a task based on agent role"""
        # Simplified context handling - just use predefined example data for each role
        example_data = self._get_example_data(self.role)
        
        # Generate prompt with context
        full_prompt = f"{self.system_prompt}\n\nTask: {task}\n\n"
        
        if example_data:
            full_prompt += "Relevant Data:\n"
            full_prompt += example_data
        
        # Add user context if available
        user_profile = context.get('user_profile', {})
        
        try:
            # Generate response
            print(f"Agent {self.role.value} processing: {task[:50]}...")
            response = self.llm_engine.generate_response(
                query=full_prompt,
                context=[],  # Context already included in the prompt
                user_profile=user_profile
            )
            
            # Calculate confidence
            confidence = self._calculate_confidence(response)
            
            # Return formatted response
            return {
                'agent': self.role.value,
                'response': response,
                'confidence': confidence,
            }
        except Exception as e:
            print(f"Error in {self.role.value} agent: {str(e)}")
            return {
                'agent': self.role.value,
                'response': f"I was unable to provide insights on {task} due to an error.",
                'confidence': 0.1,
                'error': str(e)
            }
            
    async def stream_process(self, task: str, context: Dict) -> AsyncGenerator[str, None]:
        """Process a task with streaming response"""
        # Simplified context handling - just use predefined example data for each role
        example_data = self._get_example_data(self.role)
        
        # Generate prompt with context
        full_prompt = f"{self.system_prompt}\n\nTask: {task}\n\n"
        
        if example_data:
            full_prompt += "Relevant Data:\n"
            full_prompt += example_data
        
        # Add user context if available
        user_profile = context.get('user_profile', {})
        
        try:
            # Generate streaming response
            print(f"Agent {self.role.value} streaming: {task[:50]}...")
            async for token in self.llm_engine.stream_response(
                query=full_prompt,
                context=[],  # Context already included in the prompt
                user_profile=user_profile
            ):
                yield token
        except Exception as e:
            print(f"Error in {self.role.value} streaming: {str(e)}")
            yield f"I was unable to provide insights on {task} due to an error: {str(e)}"
    
    def _get_example_data(self, role: AgentRole) -> str:
        """Get example data for each agent role"""
        examples = {
            AgentRole.BIOMARKER_INTERPRETER: """
- Total Cholesterol: 240 mg/dL (High)
- LDL: 160 mg/dL (High) 
- HDL: 45 mg/dL (Borderline)
- Triglycerides: 150 mg/dL (Borderline)
- Fasting Blood Glucose: 105 mg/dL (Prediabetic range)
- HbA1c: 5.8% (Prediabetic range)
            """,
            
            AgentRole.DNA_ANALYST: """
- APOE genotype: e3/e4 - Associated with increased risk for cardiovascular disease and Alzheimer's
- LDLR gene: One variant detected associated with familial hypercholesterolemia  
- MTHFR C677T: Heterozygous - May affect folate metabolism
            """,
            
            AgentRole.MICROBIOME_EXPERT: """
- Firmicutes: 60% (High)
- Bacteroidetes: 25% (Low)
- Actinobacteria: 8%
- Proteobacteria: 5%
- Verrucomicrobia: 2%
- High Firmicutes to Bacteroidetes ratio may indicate dysbiosis
            """,
            
            AgentRole.CORRELATION_FINDER: """
- High LDL cholesterol correlates with APOE e3/e4 genotype
- Elevated fasting glucose shows correlation with gut microbiome composition (high Firmicutes)
- MTHFR variant may influence homocysteine levels (not measured in current panel)
            """,
            
            AgentRole.RECOMMENDATION_ENGINE: """
Based on:
- Elevated cholesterol (Total & LDL)
- Prediabetic glucose markers
- APOE genetic risk
- Firmicutes-dominant gut microbiome
            """
        }
        return examples.get(role, "")
    
    def _calculate_confidence(self, response: str) -> float:
        """Calculate confidence score for response"""
        if not response:
            return 0.0
            
        # Simple heuristic - can be enhanced
        response_length = len(response)
        if response_length < 50:
            return 0.3
        elif response_length < 200:
            return 0.6
        else:
            return 0.8

class SimpleAIOrchestrator:
    """
    Simplified multi-agent coordination system for processing health queries
    Designed to work without complex dependencies
    """
    def __init__(self, llm_engine: SimpleOllamaEngine, agents: List[SimpleHealthAgent] = None):
        self.llm_engine = llm_engine
        self.agents = {}
        
        # Allow passing in pre-initialized agents
        if agents:
            for agent in agents:
                self.agents[agent.role.value] = agent
        else:
            # Initialize default agents
            self._initialize_agents()
        print("Health AI Orchestrator initialized")
        
    def _initialize_agents(self):
        self.agents[AgentRole.DNA_ANALYST.value] = SimpleHealthAgent(AgentRole.DNA_ANALYST, self.llm_engine)
        self.agents[AgentRole.MICROBIOME_EXPERT.value] = SimpleHealthAgent(AgentRole.MICROBIOME_EXPERT, self.llm_engine)
        self.agents[AgentRole.BIOMARKER_INTERPRETER.value] = SimpleHealthAgent(AgentRole.BIOMARKER_INTERPRETER, self.llm_engine)
        self.agents[AgentRole.CORRELATION_FINDER.value] = SimpleHealthAgent(AgentRole.CORRELATION_FINDER, self.llm_engine)
        self.agents[AgentRole.RECOMMENDATION_ENGINE.value] = SimpleHealthAgent(AgentRole.RECOMMENDATION_ENGINE, self.llm_engine)
        
    async def process_query(self, query: str, user_profile: Dict = None) -> AgentMessage:
        """Process a health query using multiple agents in parallel"""
        print(f"Processing health query: {query[:50]}...")
        user_context = {'user_profile': user_profile or {}}
        
        try:
            agent_types = await asyncio.to_thread(self._select_relevant_agents, query)
            print(f"Selected agents: {agent_types}")
            
            agent_tasks = []
            for agent_type in agent_types:
                if agent_type in self.agents:
                    agent = self.agents[agent_type]
                    agent_tasks.append(agent.process(query, user_context))
            
            agent_results = await asyncio.gather(*agent_tasks)
            
            synthesis = await self._synthesize_responses(query, agent_results)
            
            final_response = AgentMessage(
                role=AgentRole.ORCHESTRATOR,  
                content=synthesis.get('response', ""),
                metadata={
                    'agents_used': [r.get('agent') for r in agent_results],
                    'query': query,
                    'confidence_scores': {r.get('agent'): r.get('confidence', 0) for r in agent_results}
                }
            )
            
            print("Completed processing health query.")
            return final_response
            
        except Exception as e:
            print(f"Error orchestrating query: {str(e)}")
            return AgentMessage(
                role=AgentRole.ORCHESTRATOR,
                content=f"I'm sorry, but I encountered an error processing your query: {str(e)}",
                metadata={
                    'error': str(e),
                    'query': query
                }
            )
    
    async def _select_relevant_agents(self, query: str) -> List[str]:
        """Determine which specialist agents are needed for this query with optimized performance"""
        # First, try simple keyword matching for common cases
        query_lower = query.lower()
        
        # Common patterns for different agent types
        dna_keywords = ['dna', 'genetic', 'gene', 'mutation', 'variant', 'genome']
        microbiome_keywords = ['microbiome', 'gut', 'bacteria', 'probiotic', 'prebiotic', 'digest']
        biomarker_keywords = ['blood test', 'lab result', 'biomarker', 'level', 'high', 'low', 'test result']
        
        selected_agents = set()
        
        # Check for specific keywords first (faster than LLM call)
        if any(word in query_lower for word in dna_keywords):
            selected_agents.add(AgentRole.DNA_ANALYST.value)
        if any(word in query_lower for word in microbiome_keywords):
            selected_agents.add(AgentRole.MICROBIOME_EXPERT.value)
        if any(word in query_lower for word in biomarker_keywords):
            selected_agents.add(AgentRole.BIOMARKER_INTERPRETER.value)
            
        # If we found specific agents, use them with correlation finder
        if selected_agents:
            selected_agents.add(AgentRole.CORRELATION_FINDER.value)
            selected_agents.add(AgentRole.RECOMMENDATION_ENGINE.value)
            return list(selected_agents)
            
        # For general queries, use LLM-based selection but with a simpler prompt
        try:
            # Simplified prompt for faster response
            agent_selection_prompt = f"""Given this health query: "{query}"
            
Which of these specialist agents would be most relevant? Choose 1-2:
- dna_analyst: For genetic questions
- microbiome_expert: For gut health questions  
- biomarker_interpreter: For lab result questions

Respond with just the agent name(s) separated by commas, nothing else."""
            
            # Use a faster model with lower temperature and max tokens
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    self.llm_engine.generate_response,
                    query=agent_selection_prompt,
                    context=[],
                    user_profile={},
                    temperature=0.1,  # Very low temperature for consistency
                    max_tokens=50      # Limit response length
                ),
                timeout=3.0  # Short timeout
            )
            
            # Simple parsing of response
            selected = []
            for role in AgentRole:
                if role.value in response.lower():
                    selected.append(role.value)
            
            # Always include recommendation engine and correlation finder
            if selected:
                selected.extend([
                    AgentRole.CORRELATION_FINDER.value,
                    AgentRole.RECOMMENDATION_ENGINE.value
                ])
                return selected
                
        except (asyncio.TimeoutError, Exception) as e:
            print(f"Agent selection fallback: {str(e)}")
        
        # Default fallback
        return [
            AgentRole.CORRELATION_FINDER.value,
            AgentRole.RECOMMENDATION_ENGINE.value
        ]
    
    async def _synthesize_responses(self, query: str, agent_results: List[Dict]) -> Dict:
        """Synthesize multiple agent responses into a cohesive answer"""
        if not agent_results:
            return {
                'response': "I don't have enough information to answer your health question."
            }
            
        synthesis_prompt = f"""Original Query: {query}

Agent Insights:
"""
        
        # Add each agent's response to the prompt
        for result in agent_results:
            agent_name = result.get('agent', 'unknown')
            response = result.get('response', 'No response')
            synthesis_prompt += f"\n{agent_name}:\n{response}\n"
        
        synthesis_prompt += "\nSynthesize these insights into a comprehensive response that:"
        synthesis_prompt += "\n1. Directly answers the user's question"
        synthesis_prompt += "\n2. Highlights key findings from the analysis"
        synthesis_prompt += "\n3. Provides actionable recommendations"
        synthesis_prompt += "\n4. Notes any important limitations or caveats"
        
        try:
            final_response = self.llm_engine.generate_response(
                query=synthesis_prompt,
                context=[],
                user_profile={},
                temperature=0.7,
                max_tokens=2048
            )
            
            return {
                'response': final_response,
                'source_agents': [r.get('agent') for r in agent_results]
            }
            
        except Exception as e:
            print(f"Response synthesis error: {str(e)}")
            
            # Fallback: return the recommendation engine's response if available
            for result in agent_results:
                if result.get('agent') == 'recommendation_engine':
                    return {'response': result.get('response', '')}
            
            # Ultimate fallback
            return {
                'response': "I processed your health query but had trouble synthesizing the insights."
            }
            
    async def stream_query(self, query: str, user_profile: Dict = None) -> AsyncGenerator[str, None]:
        """Stream a response for a health query with optimized performance"""
        print(f"Streaming health query: {query[:50]}...")
        user_context = {'user_profile': user_profile or {}}
        
        try:
            # For general greetings/simple queries, use recommendation engine directly
            if any(word in query.lower() for word in ['hello', 'hi', 'hey', 'greetings']):
                agent_type = AgentRole.RECOMMENDATION_ENGINE.value
                print(f"Using {agent_type} for greeting query")
            else:
                # For other queries, use a timeout for agent selection
                try:
                    agent_types = await asyncio.wait_for(
                        self._select_relevant_agents(query),
                        timeout=5.0  # Timeout after 5 seconds
                    )
                    print(f"Selected agents for streaming: {agent_types}")
                    
                    # Prefer recommendation engine for general queries, otherwise use first selected agent
                    if AgentRole.RECOMMENDATION_ENGINE.value in agent_types:
                        agent_type = AgentRole.RECOMMENDATION_ENGINE.value
                    elif agent_types:
                        agent_type = agent_types[0]
                    else:
                        agent_type = AgentRole.RECOMMENDATION_ENGINE.value
                except asyncio.TimeoutError:
                    print("Agent selection timed out, using recommendation engine")
                    agent_type = AgentRole.RECOMMENDATION_ENGINE.value
            
            # Stream from the selected agent with a timeout
            if agent_type in self.agents:
                agent = self.agents[agent_type]
                print(f"Using {agent_type} for response generation")
                
                # Stream the response directly with timeout
                try:
                    start_time = asyncio.get_event_loop().time()
                    timeout = 30.0  # 30 second timeout for the entire stream
                    
                    # Start the streaming
                    stream = agent.stream_process(query, user_context)
                    
                    # Process the stream with timeout
                    while True:
                        try:
                            # Check if we've exceeded our timeout
                            if (asyncio.get_event_loop().time() - start_time) > timeout:
                                raise asyncio.TimeoutError("Streaming response timed out")
                                
                            # Get next chunk with a short timeout
                            token = await asyncio.wait_for(stream.__anext__(), timeout=5.0)
                            yield token
                        except StopAsyncIteration:
                            # End of stream
                            break
                            
                except asyncio.TimeoutError:
                    print("Streaming response timed out")
                    yield "\nI'm having trouble generating a complete response right now. Please try again with a more specific query."
            else:
                yield "I'm sorry, I cannot process your health query at this time."
                
        except Exception as e:
            print(f"Error in stream_query: {str(e)}")
            yield "I encountered an error processing your query. Please try again later."
