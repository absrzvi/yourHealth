#!/usr/bin/env python
"""
Test script for Simplified MCP-RAG Health AI Agents
Designed to work with local Ollama without complex dependencies
"""
import asyncio
import sys
import json
from datetime import datetime
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent))

# Import our simplified modules
from app.core.simple_llm_engine import SimpleOllamaEngine
from app.core.simple_ai_agents import AgentRole, SimpleHealthAgent, SimpleHealthOrchestrator

async def test_single_agent():
    """Test an individual agent's response generation"""
    print("\n=== Testing Single Agent ===")
    
    # Initialize LLM engine with local Ollama
    llm = SimpleOllamaEngine(
        model_name="llama3.2:latest",
        fallback_model="phi3:mini"
    )
    
    # Create a biomarker interpreter agent
    agent = SimpleHealthAgent(
        role=AgentRole.BIOMARKER_INTERPRETER,
        llm_engine=llm
    )
    
    # Test query
    query = "What does high cholesterol mean for heart health?"
    context = {'user_profile': {'age': 45, 'sex': 'M'}}
    
    # Process the query
    print(f"Query: {query}")
    print("Processing with Biomarker Interpreter agent...")
    
    response = await agent.process(query, context)
    
    print("\nAgent Response:")
    print(f"Confidence: {response['confidence']}")
    print(f"Response: {response['response'][:300]}...")  # Print first 300 chars
    
    return response

async def test_orchestrator():
    """Test the orchestrator's multi-agent coordination"""
    print("\n=== Testing Orchestrator ===")
    
    # Initialize LLM engine
    llm = SimpleOllamaEngine(
        model_name="llama3.2:latest",
        fallback_model="phi3:mini"
    )
    
    # Create the orchestrator
    orchestrator = SimpleHealthOrchestrator(llm_engine=llm)
    
    # Test query that should involve multiple agents
    query = "How might my elevated LDL cholesterol relate to my genetic predisposition and gut health?"
    
    print(f"Query: {query}")
    print("Processing with orchestrator (multiple agents)...")
    start_time = datetime.now()
    
    # Process the query
    response = await orchestrator.process_health_query(
        query=query,
        user_profile={"age": 45, "sex": "M", "health_concerns": ["heart disease", "diabetes"]}
    )
    
    duration = datetime.now() - start_time
    
    print(f"\nOrchestrator Response (took {duration.total_seconds():.2f} seconds):")
    print(f"Response: {response['response'][:500]}...")  # Print first 500 chars
    
    # Show which agents contributed
    agent_insights = response.get('agent_insights', [])
    print(f"\nAgents involved: {[insight.get('agent') for insight in agent_insights]}")
    
    return response

async def interactive_mode():
    """Start an interactive chat session with the health assistant"""
    print("\n=== Interactive Health Assistant ===")
    print("Type your health questions and get responses (type 'exit' to quit)")
    
    # Initialize LLM engine
    llm = SimpleOllamaEngine(
        model_name="llama3.2:latest",
        fallback_model="phi3:mini"
    )
    
    # Create the orchestrator
    orchestrator = SimpleHealthOrchestrator(llm_engine=llm)
    
    # Get user profile information
    print("\nLet's set up your profile first:")
    age = input("Your age (leave blank to skip): ").strip()
    sex = input("Your sex (M/F, leave blank to skip): ").strip().upper()
    concerns = input("Your health concerns (comma-separated, leave blank to skip): ").strip()
    
    user_profile = {}
    if age:
        user_profile["age"] = int(age) if age.isdigit() else age
    if sex:
        user_profile["sex"] = sex
    if concerns:
        user_profile["health_concerns"] = [c.strip() for c in concerns.split(",")]
    
    print("\nYour profile:", json.dumps(user_profile, indent=2) if user_profile else "No profile provided")
    print("\nReady! Ask your health questions (type 'exit' to quit):")
    
    while True:
        # Get user input
        query = input("\nYou: ").strip()
        if query.lower() in ['exit', 'quit']:
            print("Goodbye!")
            break
            
        if not query:
            continue
            
        # Process the query
        print("Processing your question...")
        start_time = datetime.now()
        
        response = await orchestrator.process_health_query(
            query=query,
            user_profile=user_profile
        )
        
        duration = datetime.now() - start_time
        
        # Print the response
        print(f"\nHealth Assistant (took {duration.total_seconds():.2f} seconds):")
        print(response['response'])

async def main():
    """Run the test suite"""
    print("===== Testing Simplified Health AI Agents =====")
    print("Using local Ollama for LLM inference")
    
    try:
        # Test options
        print("\nChoose a test option:")
        print("1. Test single agent")
        print("2. Test multi-agent orchestration")
        print("3. Interactive mode (chat with the health assistant)")
        print("4. Run all tests")
        
        choice = input("Enter your choice (1-4): ").strip()
        
        if choice == '1':
            await test_single_agent()
        elif choice == '2':
            await test_orchestrator()
        elif choice == '3':
            await interactive_mode()
        elif choice == '4':
            await test_single_agent()
            await test_orchestrator()
            await interactive_mode()
        else:
            print("Invalid choice")
        
        print("\n===== Tests completed =====")
        
    except Exception as e:
        print(f"\nERROR: {str(e)}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    # Run the async test suite
    asyncio.run(main())
