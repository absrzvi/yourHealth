#!/usr/bin/env python
"""
Test script for MCP-RAG Health AI Agents
This script verifies that the AI agents work correctly with your local Ollama setup.
"""
import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

# Add the app directory to the Python path
sys.path.append(str(Path(__file__).parent))

# Import our modules
from app.core.llm_engine import LocalHealthLLM
from app.core.vector_store import HealthVectorStore
from app.core.ai_agents import AgentRole, HealthAIAgent, HealthAIOrchestrator

async def test_single_agent():
    """Test an individual agent's response generation"""
    print("\n=== Testing Single Agent ===")
    
    # Initialize LLM engine with local Ollama
    llm = LocalHealthLLM(
        model_name="llama3.2:3b",  # Change this if you're using a different model
        fallback_model="phi3:mini"  # Optional fallback model
    )
    
    # Initialize a test vector store (temporary)
    vector_store = HealthVectorStore(
        persist_directory="./test_vector_store",
        embedding_model_name="all-MiniLM-L6-v2"
    )
    
    # Create a biomarker interpreter agent
    agent = HealthAIAgent(
        role=AgentRole.BIOMARKER_INTERPRETER,
        llm_engine=llm,
        vector_store=vector_store
    )
    
    # Test query
    query = "What does high cholesterol mean for heart health?"
    context = {'user_id': 'test_user', 'user_profile': {'age': 45, 'sex': 'M'}}
    
    # Process the query
    print(f"Query: {query}")
    print("Processing with Biomarker Interpreter agent...")
    
    response = await agent.process(query, context)
    
    print("\nAgent Response:")
    print(f"Confidence: {response['confidence']}")
    print(f"Response: {response['response']}")
    
    return response

async def test_orchestrator():
    """Test the orchestrator's multi-agent coordination"""
    print("\n=== Testing Orchestrator ===")
    
    # Initialize LLM engine and vector store
    llm = LocalHealthLLM(
        model_name="llama3.2:3b",
        fallback_model="phi3:mini"
    )
    
    vector_store = HealthVectorStore(
        persist_directory="./test_vector_store",
        embedding_model_name="all-MiniLM-L6-v2"
    )
    
    # Create sample data for testing
    create_sample_data(vector_store)
    
    # Create the orchestrator
    orchestrator = HealthAIOrchestrator(
        llm_engine=llm,
        vector_store=vector_store
    )
    
    # Test query that should involve multiple agents
    query = "How might my elevated LDL cholesterol relate to my genetic predisposition?"
    
    print(f"Query: {query}")
    print("Processing with orchestrator (multiple agents)...")
    start_time = datetime.now()
    
    # Process the query
    response = await orchestrator.process_health_query(
        query=query,
        user_id="test_user",
        user_profile={"age": 45, "sex": "M", "health_concerns": ["heart disease", "diabetes"]}
    )
    
    duration = datetime.now() - start_time
    
    print(f"\nOrchestrator Response (took {duration.total_seconds():.2f} seconds):")
    print(f"Response: {response['response']}")
    
    # Show which agents contributed
    agent_insights = response.get('agent_insights', [])
    print(f"\nAgents involved: {[insight.get('agent') for insight in agent_insights]}")
    
    return response

def create_sample_data(vector_store):
    """Create some sample health data for testing"""
    # Add sample biomarker data
    vector_store.add_health_data(
        collection_name="biomarkers",
        user_id="test_user",
        documents=[
            {
                "id": "lipid_panel_2024",
                "content": "Total Cholesterol: 240 mg/dL (High)\nLDL: 160 mg/dL (High)\nHDL: 45 mg/dL (Borderline)\nTriglycerides: 150 mg/dL (Borderline)",
                "metadata": {"type": "lipid_panel", "date": "2024-05-15"}
            },
            {
                "id": "glucose_2024",
                "content": "Fasting Blood Glucose: 105 mg/dL (Prediabetic range)\nHbA1c: 5.8% (Prediabetic range)",
                "metadata": {"type": "glucose", "date": "2024-05-15"}
            }
        ]
    )
    
    # Add sample DNA data
    vector_store.add_health_data(
        collection_name="dna",
        user_id="test_user",
        documents=[
            {
                "id": "apoe_gene",
                "content": "APOE genotype: e3/e4 - Associated with increased risk for cardiovascular disease and Alzheimer's",
                "metadata": {"gene": "APOE", "rsid": "rs429358,rs7412"}
            },
            {
                "id": "ldlr_gene",
                "content": "LDLR gene: One variant detected associated with familial hypercholesterolemia",
                "metadata": {"gene": "LDLR", "rsid": "rs28942083"}
            }
        ]
    )
    
    # Add sample microbiome data
    vector_store.add_health_data(
        collection_name="microbiome",
        user_id="test_user",
        documents=[
            {
                "id": "gut_bacteria",
                "content": "Firmicutes: 60% (High)\nBacteroidetes: 25% (Low)\nActinobacteria: 8%\nProteobacteria: 5%\nVerrucomicrobia: 2%\nHigh Firmicutes to Bacteroidetes ratio may indicate dysbiosis.",
                "metadata": {"type": "bacteria_ratios", "date": "2024-04-30"}
            }
        ]
    )
    
    print("Added sample health data to vector store for testing")

async def main():
    """Run the test suite"""
    print("===== Testing MCP-RAG Health AI Agents =====")
    print("Using local Ollama for LLM inference")
    
    try:
        # Test a single agent first
        await test_single_agent()
        
        # Then test the orchestrator
        await test_orchestrator()
        
        print("\n===== All tests completed successfully =====")
        
    except Exception as e:
        print(f"\nERROR: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
    finally:
        # Clean up temporary test data
        if os.path.exists("./test_vector_store"):
            import shutil
            try:
                # Comment this out if you want to keep test data for inspection
                # shutil.rmtree("./test_vector_store")
                print("\nNOTE: Test vector store has been kept for inspection.")
            except:
                print("\nFailed to clean up test vector store")

if __name__ == "__main__":
    # Run the async test suite
    asyncio.run(main())
