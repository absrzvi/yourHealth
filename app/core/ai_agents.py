"""
MCP-RAG Health AI Orchestration System
Multi-agent coordination for HIPAA-compliant health data analysis
"""
from enum import Enum
from dataclasses import dataclass, field
from typing import Dict, Any, List, Callable, Optional, Union, Generator
import asyncio
import json
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger(__name__)

class AgentRole(Enum):
    """Role-specific expert agents for health analysis"""
    ORCHESTRATOR = "orchestrator"
    DNA_ANALYST = "dna_analyst"
    MICROBIOME_EXPERT = "microbiome_expert"
    BIOMARKER_INTERPRETER = "biomarker_interpreter"
    CORRELATION_FINDER = "correlation_finder"
    RECOMMENDATION_ENGINE = "recommendation_engine"

@dataclass
class AgentMessage:
    role: AgentRole
    content: str
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())

class HealthAIAgent:
    """
    Expert agent for a specific health domain (DNA, Microbiome, Biomarkers, etc)
    Handles domain-specific analysis and retrieves relevant context from vector store
    """
    def __init__(self, 
                 role: AgentRole,
                 llm_engine: Any,  # Avoiding circular imports - should be LocalHealthLLM
                 vector_store: Optional[Any] = None,  # Should be HealthVectorStore 
                 tools: Optional[List[Callable]] = None):
        self.role = role
        self.llm_engine = llm_engine
        self.vector_store = vector_store
        self.tools = tools or []
        self.message_history: List[AgentMessage] = []
        self.system_prompt = self._default_prompt_template()
        
        logger.info(f"Initialized {self.role.value} agent")

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
        # Search relevant data if vector store available
        search_results = []
        if self.vector_store:
            search_results = await self._search_relevant_data(task, context)
        
        # Generate prompt with context
        full_prompt = f"{self.system_prompt}\n\nTask: {task}\n\n"
        
        if search_results:
            full_prompt += "Relevant Data:\n"
            for result in search_results[:3]:  # Limit context size
                full_prompt += f"- {result.get('content', '')}\n"
        
        # Add user context if available
        if 'user_profile' in context:
            full_prompt += f"\nUser Profile:\n"
            for key, value in context['user_profile'].items():
                full_prompt += f"- {key}: {value}\n"
        
        # Generate response
        try:
            response = self.llm_engine.generate_response(
                query=task,
                context=search_results,
                user_profile=context.get('user_profile', {})
            )
            
            # Create message and store in history
            message = AgentMessage(
                role=self.role,
                content=response,
                metadata={'task': task, 'context': context},
                timestamp=datetime.now().isoformat()
            )
            self.message_history.append(message)
            
            # Return formatted response
            return {
                'agent': self.role.value,
                'response': response,
                'confidence': self._calculate_confidence(response),
                'sources': [r.get('id', '') for r in search_results[:3]] if search_results else []
            }
            
        except Exception as e:
            logger.error(f"Error in {self.role.value} agent: {str(e)}")
            return {
                'agent': self.role.value,
                'response': f"Unable to analyze {self.role.value} data: {str(e)}",
                'confidence': 0.1,
                'error': str(e)
            }
    
    async def _search_relevant_data(self, task: str, context: Dict) -> List[Dict]:
        """Search vector store for relevant data"""
        if not self.vector_store:
            return []
            
        # Determine which collections to search based on role
        collection_map = {
            AgentRole.DNA_ANALYST: ['dna'],
            AgentRole.MICROBIOME_EXPERT: ['microbiome'],
            AgentRole.BIOMARKER_INTERPRETER: ['biomarkers'],
            AgentRole.CORRELATION_FINDER: ['dna', 'microbiome', 'biomarkers', 'correlations'],
            AgentRole.RECOMMENDATION_ENGINE: ['recommendations', 'correlations']
        }
        
        collections = collection_map.get(self.role, ['correlations'])
        user_id = context.get('user_id', 'default')
        
        try:
            return self.vector_store.semantic_search(
                query=task,
                collection_names=collections,
                user_id=user_id,
                top_k=5
            )
        except Exception as e:
            logger.error(f"Error searching vector store: {str(e)}")
            return []
    
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

class HealthAIOrchestrator:
    """
    Orchestrates multiple HealthAIAgents to answer complex health queries.
    Retrieves context from the vector store and coordinates expert agents.
    """
    def __init__(self, llm_engine, vector_store):
        self.llm_engine = llm_engine
        self.vector_store = vector_store
        self.agents = self._initialize_agents()
        logger.info("Health AI Orchestrator initialized with all agents")
        
    def _initialize_agents(self) -> Dict[AgentRole, HealthAIAgent]:
        """Initialize all specialist agents"""
        agents = {}
        for role in AgentRole:
            if role != AgentRole.ORCHESTRATOR:  # Skip orchestrator role
                agents[role] = HealthAIAgent(
                    role=role,
                    llm_engine=self.llm_engine,
                    vector_store=self.vector_store
                )
        return agents
        
    async def process_health_query(self, 
                                  query: str, 
                                  user_id: str,
                                  user_profile: Dict = None,
                                  top_k: int = 3) -> Dict[str, Any]:
        """
        Orchestrate multi-agent processing of health query
        1. Dynamically select relevant agents
        2. Run selected agents in parallel
        3. Synthesize results into cohesive response
        """
        user_profile = user_profile or {}
        
        try:
            # Step 1: Determine which agents to involve based on query
            selected_agents = await self._select_relevant_agents(query)
            
            # Step 2: Run selected agents in parallel
            context = {'user_id': user_id, 'user_profile': user_profile}
            agent_tasks = []
            
            for agent_name in selected_agents:
                try:
                    role = AgentRole(agent_name)
                    if role in self.agents:
                        agent_tasks.append(
                            self.agents[role].process(query, context)
                        )
                except (ValueError, KeyError) as e:
                    logger.warning(f"Invalid agent: {agent_name} - {str(e)}")
            
            # Execute agents concurrently
            agent_results = await asyncio.gather(*agent_tasks)
            
            # Step 3: Synthesize results into cohesive response
            final_response = await self._synthesize_responses(query, agent_results)
            
            # Step 4: Store the conversation in chat memory for future context
            if self.vector_store:
                try:
                    self.vector_store.add_health_data(
                        collection_name='chat_memory',
                        user_id=user_id,
                        documents=[{
                            'id': f"chat_{datetime.now().isoformat()}",
                            'content': f"Query: {query}\nResponse: {final_response['response']}",
                            'metadata': {'type': 'conversation'}
                        }]
                    )
                except Exception as e:
                    logger.error(f"Failed to store conversation: {str(e)}")
                    
            return {
                'query': query,
                'response': final_response['response'],
                'agent_insights': agent_results,
                'timestamp': datetime.now().isoformat(),
                'user_id': user_id
            }
            
        except Exception as e:
            logger.error(f"Orchestration error: {str(e)}")
            return {
                'query': query,
                'response': f"I encountered an error processing your health query: {str(e)}",
                'error': str(e),
                'timestamp': datetime.now().isoformat(),
                'user_id': user_id
            }
    
    async def _select_relevant_agents(self, query: str) -> List[str]:
        """Determine which specialist agents are needed for this query"""
        agent_selection_prompt = f"""Given this health query: "{query}"
        
Which specialist agents should be involved? Choose from:
- dna_analyst: For genetic questions
- microbiome_expert: For gut health questions  
- biomarker_interpreter: For lab result questions
- correlation_finder: For finding patterns across data types
- recommendation_engine: For personalized recommendations

Return a JSON list of agent names needed."""
        
        try:
            # Ask LLM which agents to involve
            response = self.llm_engine.generate_response(
                query=agent_selection_prompt,
                context=[],
                user_profile={},
            )
            
            # Parse response as JSON list
            try:
                selected_agents = json.loads(response)
                if isinstance(selected_agents, list):
                    return selected_agents
            except:
                # JSON parsing failed
                logger.warning("Failed to parse agent selection as JSON")
                
        except Exception as e:
            logger.error(f"Agent selection error: {str(e)}")
        
        # Default to these two if anything fails
        return ['correlation_finder', 'recommendation_engine']
    
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
                user_profile={}
            )
            
            return {
                'response': final_response,
                'source_agents': [r.get('agent') for r in agent_results]
            }
            
        except Exception as e:
            logger.error(f"Response synthesis error: {str(e)}")
            
            # Fallback: return the recommendation engine's response if available
            for result in agent_results:
                if result.get('agent') == 'recommendation_engine':
                    return {'response': result.get('response', '')}
            
            # Ultimate fallback
            return {
                'response': "I processed your health query but had trouble synthesizing the insights."
            }
