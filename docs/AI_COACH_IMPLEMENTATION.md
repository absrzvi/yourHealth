AI-Coach Implementation & Integration Plan
MedGemma + RAG + AGUI Protocol Integration
Architecture Overview
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend UI   │◄──►│   AGUI Client    │◄──►│  Backend Agent  │
│   (React)       │    │  (CopilotKit)    │    │   (FastAPI)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
                       ┌─────────────────────────────────────────┐
                       │            AI Coach Agent Core           │
                       │  ┌─────────────┐  ┌─────────────────┐   │
                       │  │ MedGemma    │  │   RAG Engine    │   │
                       │  │ 4b-it       │  │   (ragbits)     │   │
                       │  │ (Local)     │  │                 │   │
                       │  └─────────────┘  └─────────────────┘   │
                       └─────────────────────────────────────────┘
                                         │
                                         ▼
                       ┌─────────────────────────────────────────┐
                       │        Medical Knowledge Sources         │
                       │  ┌─────────────┐  ┌─────────────────┐   │
                       │  │   Local     │  │   External APIs │   │
                       │  │ Knowledge   │  │ • PubMed        │   │
                       │  │   Base      │  │ • FHIR          │   │
                       │  │             │  │ • Medical DBs   │   │
                       │  └─────────────┘  └─────────────────┘   │
                       └─────────────────────────────────────────┘
Phase 1: Core Infrastructure Setup
1.1 Local LLM Integration (MedGemma 4b-it)
python# backend/services/llm_service.py
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from typing import List, Dict, Any
import logging

class MedGemmaService:
    def __init__(self, model_name: str = "google/medgemma-4b-it"):
        self.model_name = model_name
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = None
        self.tokenizer = None
        self._load_model()
    
    def _load_model(self):
        """Load MedGemma model and tokenizer"""
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                trust_remote_code=True
            )
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=True
            )
            logging.info(f"MedGemma model loaded on {self.device}")
        except Exception as e:
            logging.error(f"Failed to load MedGemma: {e}")
            raise
    
    def generate_response(
        self, 
        prompt: str, 
        max_length: int = 512,
        temperature: float = 0.7,
        context: List[Dict] = None
    ) -> str:
        """Generate medical advice response"""
        
        # Format prompt with medical context
        formatted_prompt = self._format_medical_prompt(prompt, context)
        
        inputs = self.tokenizer.encode(
            formatted_prompt, 
            return_tensors="pt"
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                inputs,
                max_length=max_length,
                temperature=temperature,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
                repetition_penalty=1.1
            )
        
        response = self.tokenizer.decode(
            outputs[0][inputs.shape[1]:], 
            skip_special_tokens=True
        )
        
        return self._post_process_medical_response(response)
    
    def _format_medical_prompt(self, query: str, context: List[Dict] = None) -> str:
        """Format prompt with medical safety guidelines"""
        system_prompt = """You are MedGemma, a medical AI assistant. Always:
1. Emphasize consulting healthcare professionals
2. Provide evidence-based information
3. Include appropriate medical disclaimers
4. Cite sources when available
5. Never provide emergency medical advice

Context from medical literature:
"""
        
        if context:
            for item in context[:3]:  # Limit context
                system_prompt += f"- {item.get('content', '')}\n"
                if 'source' in item:
                    system_prompt += f"  Source: {item['source']}\n"
        
        return f"{system_prompt}\n\nUser Query: {query}\n\nResponse:"
    
    def _post_process_medical_response(self, response: str) -> str:
        """Add medical disclaimers and formatting"""
        disclaimer = "\n\n⚠️ Medical Disclaimer: This information is for educational purposes only. Always consult with a qualified healthcare professional for medical advice, diagnosis, or treatment."
        
        return response.strip() + disclaimer
1.2 RAG Implementation with ragbits
python# backend/services/rag_service.py
from ragbits.core.vector_stores import VectorStore
from ragbits.core.embeddings import EmbeddingModel
from ragbits.core.retrievers import VectorStoreRetriever
from ragbits.core.llms import LLM
from ragbits.document_search import DocumentSearch
from typing import List, Dict, Any
import asyncio

class MedicalRAGService:
    def __init__(self, vector_store_config: Dict[str, Any]):
        self.vector_store = self._setup_vector_store(vector_store_config)
        self.embedding_model = EmbeddingModel.from_config({
            "model_name": "sentence-transformers/all-MiniLM-L6-v2",
            "device": "cuda" if torch.cuda.is_available() else "cpu"
        })
        self.retriever = VectorStoreRetriever(
            vector_store=self.vector_store,
            embedding_model=self.embedding_model,
            top_k=5
        )
        self.document_search = DocumentSearch(retriever=self.retriever)
    
    def _setup_vector_store(self, config: Dict[str, Any]) -> VectorStore:
        """Setup vector store for medical documents"""
        return VectorStore.from_config({
            "type": "chroma",  # or "faiss", "pinecone"
            "persist_directory": "./data/medical_vector_store",
            "collection_name": "medical_knowledge",
            **config
        })
    
    async def add_medical_documents(self, documents: List[Dict[str, Any]]):
        """Add medical documents to RAG knowledge base"""
        processed_docs = []
        
        for doc in documents:
            # Add medical metadata
            processed_doc = {
                **doc,
                "metadata": {
                    **doc.get("metadata", {}),
                    "domain": "medical",
                    "indexed_at": datetime.utcnow().isoformat(),
                    "compliance_level": doc.get("compliance_level", "research"),
                    "citation_required": True
                }
            }
            processed_docs.append(processed_doc)
        
        await self.document_search.add_documents(processed_docs)
    
    async def retrieve_context(
        self, 
        query: str, 
        filters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant medical context"""
        
        # Add medical-specific filters
        medical_filters = {
            "domain": "medical",
            **(filters or {})
        }
        
        results = await self.document_search.search(
            query=query,
            filters=medical_filters,
            top_k=5
        )
        
        # Format results with citation info
        formatted_results = []
        for result in results:
            formatted_results.append({
                "content": result.content,
                "source": result.metadata.get("source", "Unknown"),
                "confidence": result.score,
                "citation": self._format_citation(result.metadata),
                "compliance_level": result.metadata.get("compliance_level", "research")
            })
        
        return formatted_results
    
    def _format_citation(self, metadata: Dict[str, Any]) -> str:
        """Format medical citation"""
        if "pubmed_id" in metadata:
            return f"PubMed ID: {metadata['pubmed_id']}"
        elif "doi" in metadata:
            return f"DOI: {metadata['doi']}"
        elif "source" in metadata:
            return f"Source: {metadata['source']}"
        else:
            return "Internal Knowledge Base"
1.3 Medical API Integrations
python# backend/services/medical_apis.py
import httpx
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

class MedicalAPIService:
    def __init__(self, config: Dict[str, str]):
        self.pubmed_api_key = config.get("pubmed_api_key")
        self.fhir_base_url = config.get("fhir_base_url", "https://hapi.fhir.org/baseR4")
        self.client = httpx.AsyncClient(timeout=30.0)
    
    async def search_pubmed(
        self, 
        query: str, 
        max_results: int = 10,
        filters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Search PubMed for recent medical literature"""
        
        # Format query for medical relevance
        formatted_query = f"{query} AND (clinical[Title/Abstract] OR diagnosis[Title/Abstract] OR treatment[Title/Abstract])"
        
        params = {
            "db": "pubmed",
            "term": formatted_query,
            "retmax": max_results,
            "retmode": "json",
            "sort": "relevance",
            "reldate": 1095,  # Last 3 years
        }
        
        if self.pubmed_api_key:
            params["api_key"] = self.pubmed_api_key
        
        try:
            response = await self.client.get(
                "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
                params=params
            )
            response.raise_for_status()
            
            search_results = response.json()
            pmids = search_results.get("esearchresult", {}).get("idlist", [])
            
            # Fetch article details
            articles = await self._fetch_pubmed_details(pmids)
            
            return [
                {
                    "content": article.get("abstract", ""),
                    "title": article.get("title", ""),
                    "source": f"PubMed ID: {article.get('pmid')}",
                    "metadata": {
                        "pubmed_id": article.get("pmid"),
                        "authors": article.get("authors", []),
                        "journal": article.get("journal", ""),
                        "publication_date": article.get("pubdate", ""),
                        "compliance_level": "peer_reviewed",
                        "domain": "medical"
                    }
                }
                for article in articles
            ]
            
        except Exception as e:
            logging.error(f"PubMed search failed: {e}")
            return []
    
    async def _fetch_pubmed_details(self, pmids: List[str]) -> List[Dict[str, Any]]:
        """Fetch detailed article information from PubMed"""
        if not pmids:
            return []
        
        params = {
            "db": "pubmed",
            "id": ",".join(pmids),
            "retmode": "json",
            "rettype": "abstract"
        }
        
        try:
            response = await self.client.get(
                "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi",
                params=params
            )
            response.raise_for_status()
            
            # Parse PubMed XML/JSON response
            # Implementation depends on exact response format
            return self._parse_pubmed_response(response.text)
            
        except Exception as e:
            logging.error(f"Failed to fetch PubMed details: {e}")
            return []
    
    async def search_medical_databases(
        self, 
        query: str,
        databases: List[str] = None
    ) -> List[Dict[str, Any]]:
        """Search multiple medical databases"""
        
        databases = databases or ["pubmed", "cochrane", "clinical_trials"]
        results = []
        
        tasks = []
        if "pubmed" in databases:
            tasks.append(self.search_pubmed(query))
        
        # Add other database searches here
        if "cochrane" in databases:
            tasks.append(self._search_cochrane(query))
        
        if "clinical_trials" in databases:
            tasks.append(self._search_clinical_trials(query))
        
        all_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        for result in all_results:
            if isinstance(result, list):
                results.extend(result)
        
        return results
    
    async def _search_cochrane(self, query: str) -> List[Dict[str, Any]]:
        """Search Cochrane Library"""
        # Implementation for Cochrane Library API
        pass
    
    async def _search_clinical_trials(self, query: str) -> List[Dict[str, Any]]:
        """Search ClinicalTrials.gov"""
        # Implementation for ClinicalTrials.gov API
        pass
Phase 2: AGUI Integration
2.1 AGUI-Compatible Agent
python# backend/agents/medical_coach_agent.py
from typing import Dict, List, Any, AsyncGenerator
import asyncio
import json
from datetime import datetime

class MedicalCoachAgent:
    def __init__(
        self,
        llm_service: MedGemmaService,
        rag_service: MedicalRAGService,
        api_service: MedicalAPIService
    ):
        self.llm_service = llm_service
        self.rag_service = rag_service
        self.api_service = api_service
        self.conversation_history = []
        
    async def process_query(self, query: str, session_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Process medical query with AGUI event streaming"""
        
        # Emit run started event
        yield {
            "type": "run_started",
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": session_id
        }
        
        try:
            # Emit thinking state
            yield {
                "type": "agentic_state_update",
                "data": {
                    "status": "analyzing_query",
                    "message": "Analyzing your medical query...",
                    "progress": 10
                }
            }
            
            # Step 1: Retrieve local RAG context
            local_context = await self.rag_service.retrieve_context(query)
            
            yield {
                "type": "agentic_state_update", 
                "data": {
                    "status": "searching_knowledge_base",
                    "message": f"Found {len(local_context)} relevant documents in knowledge base",
                    "progress": 30
                }
            }
            
            # Step 2: Search external medical databases
            yield {
                "type": "agentic_state_update",
                "data": {
                    "status": "searching_external_sources",
                    "message": "Searching latest medical literature...",
                    "progress": 50
                }
            }
            
            external_context = await self.api_service.search_medical_databases(query)
            
            # Step 3: Generate response with MedGemma
            all_context = local_context + external_context[:3]  # Limit context
            
            yield {
                "type": "agentic_state_update",
                "data": {
                    "status": "generating_response",
                    "message": "Generating evidence-based response...",
                    "progress": 80,
                    "sources_found": len(all_context)
                }
            }
            
            response = self.llm_service.generate_response(
                prompt=query,
                context=all_context
            )
            
            # Format response with citations
            formatted_response = self._format_response_with_citations(
                response, 
                all_context
            )
            
            # Emit text message with response
            yield {
                "type": "text_message",
                "content": formatted_response["text"],
                "metadata": {
                    "sources": formatted_response["sources"],
                    "confidence_level": formatted_response["confidence"],
                    "medical_disclaimer": True
                }
            }
            
            # Emit human-in-the-loop for critical cases
            if self._requires_human_review(query, response):
                yield {
                    "type": "action_execution",
                    "name": "medical_review_required",
                    "arguments": {
                        "query": query,
                        "ai_response": response,
                        "risk_level": "medium",
                        "message": "This query may require professional medical consultation. Would you like me to provide general information only?"
                    }
                }
            
            # Emit final state
            yield {
                "type": "agentic_state_update",
                "data": {
                    "status": "completed",
                    "message": "Response generated successfully",
                    "progress": 100
                }
            }
            
        except Exception as e:
            yield {
                "type": "error",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        
        finally:
            yield {
                "type": "run_stopped",
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": session_id
            }
    
    def _format_response_with_citations(
        self, 
        response: str, 
        context: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Format response with proper medical citations"""
        
        sources = []
        for item in context:
            if item.get("confidence", 0) > 0.7:  # High confidence sources only
                sources.append({
                    "citation": item.get("citation", ""),
                    "compliance_level": item.get("compliance_level", "research"),
                    "confidence": item.get("confidence", 0)
                })
        
        # Add citation numbers to response
        citations_text = "\n\n**Sources:**\n"
        for i, source in enumerate(sources, 1):
            citations_text += f"{i}. {source['citation']} (Confidence: {source['confidence']:.2f})\n"
        
        return {
            "text": response + citations_text,
            "sources": sources,
            "confidence": sum(s["confidence"] for s in sources) / len(sources) if sources else 0
        }
    
    def _requires_human_review(self, query: str, response: str) -> bool:
        """Determine if query requires human medical professional review"""
        high_risk_keywords = [
            "emergency", "urgent", "severe pain", "chest pain", 
            "difficulty breathing", "overdose", "suicide", "self-harm"
        ]
        
        return any(keyword in query.lower() for keyword in high_risk_keywords)
2.2 FastAPI AGUI Server
python# backend/main.py
from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import json
from typing import Dict, Any
import logging

app = FastAPI(title="Medical AI Coach API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
llm_service = MedGemmaService()
rag_service = MedicalRAGService(vector_store_config={})
api_service = MedicalAPIService(config={})
medical_agent = MedicalCoachAgent(llm_service, rag_service, api_service)

@app.websocket("/agui")
async def agui_websocket(websocket: WebSocket):
    """AGUI protocol WebSocket endpoint"""
    await websocket.accept()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "user_message":
                query = message.get("content", "")
                session_id = message.get("session_id", "default")
                
                # Process query and stream AGUI events
                async for event in medical_agent.process_query(query, session_id):
                    await websocket.send_text(json.dumps(event))
            
            elif message.get("type") == "action_response":
                # Handle human-in-the-loop responses
                await handle_action_response(websocket, message)
                
    except Exception as e:
        logging.error(f"WebSocket error: {e}")
        await websocket.close()

async def handle_action_response(websocket: WebSocket, message: Dict[str, Any]):
    """Handle action responses from frontend"""
    action_name = message.get("action_name")
    response_data = message.get("response_data")
    
    if action_name == "medical_review_required":
        if response_data.get("proceed") == "general_info_only":
            # Provide general information response
            await websocket.send_text(json.dumps({
                "type": "text_message",
                "content": "I can provide general health information. For specific medical concerns, please consult a healthcare professional."
            }))

@app.post("/api/upload-medical-documents")
async def upload_medical_documents(documents: List[Dict[str, Any]]):
    """Upload medical documents to RAG knowledge base"""
    try:
        await rag_service.add_medical_documents(documents)
        return {"status": "success", "count": len(documents)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "services": {
            "llm": "MedGemma-4b-it",
            "rag": "ragbits",
            "vector_store": "active"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
Phase 3: Frontend Integration
3.1 React Component with AGUI
tsx// frontend/components/MedicalCoach.tsx
import React, { useState } from 'react';
import { 
  CopilotKit, 
  useCopilotChat, 
  useCopilotAction,
  useCopilotReadable 
} from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";

interface MedicalCoachProps {
  userId: string;
}

export const MedicalCoach: React.FC<MedicalCoachProps> = ({ userId }) => {
  const [medicalHistory, setMedicalHistory] = useState<string[]>([]);
  const [currentSymptoms, setCurrentSymptoms] = useState<string>("");
  
  // Make medical context readable to the agent
  useCopilotReadable({
    description: "User's medical history and current symptoms",
    value: {
      medicalHistory,
      currentSymptoms,
      lastConsultation: new Date().toISOString(),
    }
  });
  
  // Define action for emergency situations
  useCopilotAction({
    name: "emergency_protocol",
    description: "Handle medical emergency situations",
    parameters: [
      {
        name: "urgency_level",
        type: "string",
        enum: ["low", "medium", "high", "critical"],
        required: true,
      },
      {
        name: "symptoms",
        type: "string", 
        required: true,
      }
    ],
    handler: async ({ urgency_level, symptoms }) => {
      if (urgency_level === "critical" || urgency_level === "high") {
        // Show emergency contact information
        return {
          type: "emergency_response",
          message: "🚨 For medical emergencies, call 911 immediately. This AI cannot replace emergency medical care.",
          emergency_contacts: [
            { service: "Emergency Services", number: "911" },
            { service: "Poison Control", number: "1-800-222-1222" }
          ]
        };
      }
      
      return {
        type: "standard_response", 
        message: "I'll help you understand your symptoms. Remember to consult a healthcare professional for medical advice."
      };
    }
  });
  
  // Define action for medical consultation scheduling
  useCopilotAction({
    name: "schedule_consultation",
    description: "Help user schedule medical consultation",
    parameters: [
      {
        name: "specialty",
        type: "string",
        required: true,
      },
      {
        name: "urgency",
        type: "string",
        enum: ["routine", "urgent", "same_day"],
        required: true,
      }
    ],
    handler: async ({ specialty, urgency }) => {
      // Integration with scheduling system
      return {
        message: `I recommend scheduling a ${urgency} ${specialty} consultation. Here are some options in your area.`,
        scheduling_options: [
          { provider: "Local Health Center", availability: "Next day" },
          { provider: "Urgent Care", availability: "Same day" }
        ]
      };
    }
  });

  return (
    <div className="medical-coach-container">
      <div className="medical-context-panel">
        <h3>Medical Context</h3>
        
        <div className="symptoms-input">
          <label>Current Symptoms:</label>
          <textarea
            value={currentSymptoms}
            onChange={(e) => setCurrentSymptoms(e.target.value)}
            placeholder="Describe your current symptoms..."
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="medical-history">
          <label>Medical History:</label>
          <div className="history-list">
            {medicalHistory.map((item, index) => (
              <div key={index} className="history-item">
                {item}
              </div>
            ))}
          </div>
          <button 
            onClick={() => {
              const newItem = prompt("Add medical history item:");
              if (newItem) {
                setMedicalHistory([...medicalHistory, newItem]);
              }
            }}
            className="btn-add-history"
          >
            Add History Item
          </button>
        </div>
      </div>
      
      <CopilotSidebar
        labels={{
          title: "🏥 Medical AI Coach",
          initial: "Hi! I'm your medical AI coach. I can help you understand health information and guide you to appropriate care. How can I assist you today?"
        }}
        defaultOpen={true}
        className="medical-chat-sidebar"
      />
    </div>
  );
};
3.2 Main App Integration
tsx// frontend/App.tsx
import React from 'react';
import { CopilotKit } from "@copilotkit/react-core";
import { MedicalCoach } from './components/MedicalCoach';
import "@copilotkit/react-ui/styles.css";

function App() {
  return (
    <CopilotKit 
      runtimeUrl="ws://localhost:8000/agui"
      agent="medical-coach"
    >
      <div className="App">
        <header className="App-header">
          <h1>🏥 Medical AI Coach</h1>
          <p>Evidence-based health guidance powered by MedGemma</p>
        </header>
        
        <main>
          <MedicalCoach userId="user123" />
        </main>
        
        <footer className="medical-disclaimer">
          <p>
            ⚠️ <strong>Important:</strong> This AI coach provides general health information only. 
            Always consult qualified healthcare professionals for medical advice, diagnosis, or treatment.
          </p>
        </footer>
      </div>
    </CopilotKit>
  );
}

export default App;
Phase 4: Deployment & Configuration
4.1 Docker Setup
dockerfile# Dockerfile.backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Download MedGemma model (optional - can be done at runtime)
RUN python -c "from transformers import AutoTokenizer, AutoModelForCausalLM; AutoTokenizer.from_pretrained('google/medgemma-4b-it'); AutoModelForCausalLM.from_pretrained('google/medgemma-4b-it')"

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
yaml# docker-compose.yml
version: '3.8'

services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - PUBMED_API_KEY=${PUBMED_API_KEY}
      - FHIR_BASE_URL=${FHIR_BASE_URL}
    volumes:
      - ./data:/app/data
      - model_cache:/root/.cache/huggingface
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
  
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=ws://localhost:8000
    depends_on:
      - backend

  vector_db:
    image: chromadb/chroma:latest
    ports:
      - "8001:8000"
    volumes:
      - chroma_data:/chroma/chroma

volumes:
  model_cache:
  chroma_data:
4.2 Configuration Files
python# backend/config.py
from pydantic import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # LLM Configuration
    model_name: str = "google/medgemma-4b-it"
    device: str = "auto"
    max_tokens: int = 512
    temperature: float = 0.7
    
    # RAG Configuration
    vector_store_type: str = "chroma"
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"
    top_k_results: int = 5
    
    # API Configuration
    pubmed_api_key: Optional[str] = None
    fhir_base_url: str = "https://hapi.fhir.org/baseR4"
    rate_limit_requests: int = 100
    rate_limit_period: int = 3600
    
    # Security
    enable_medical_filtering: bool = True
    require_disclaimers: bool = True
    log_medical_queries: bool = True
    
    # AGUI Configuration
    websocket_timeout: int = 300
    max_session_duration: int = 3600
    
    class Config:
        env_file = ".env"

settings = Settings()
Implementation Timeline
Week 1-2: Infrastructure Setup

 Set up MedGemma 4b-it local deployment
 Implement ragbits RAG system
 Configure vector database (ChromaDB)
 Set up basic FastAPI backend

Week 3-4: Medical API Integration

 Implement PubMed API integration
 Add FHIR standard support
 Create medical knowledge ingestion pipeline
 Implement citation and compliance tracking

Week 5-6: AGUI Protocol Integration

 Implement AGUI event system
 Create medical coach agent with streaming
 Add human-in-the-loop workflows
 Implement safety checks and disclaimers

Week 7-8: Frontend Development

 Build React components with CopilotKit
 Implement medical context management
 Add emergency protocol handling
 Create responsive medical UI

Week 9-10: Testing & Deployment

 Medical accuracy testing
 Performance optimization
 Security and compliance review
 Production deployment setup

Key Compliance Considerations

Medical Disclaimers: Every response includes appropriate medical disclaimers
Emergency Detection: Automatic detection of emergency situations with appropriate responses
Source Citation: All medical information properly cited with confidence levels
Privacy Protection: No storage of personal medical information without consent
Professional Guidance: Consistent emphasis on consulting healthcare professionals

This implementation provides a robust, compliant, and user-friendly medical AI coach that leverages cutting-edge local LLMs, RAG technology, and the AGUI protocol for seamless user interaction.