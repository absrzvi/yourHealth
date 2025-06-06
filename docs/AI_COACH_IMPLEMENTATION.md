Complete CPU-Compatible AI Health Coach Implementation Guide
Based on your requirements, I'll combine the RAG system from AI-RAG.md with the AI Coach implementation, making everything CPU-compatible and Windsurf-ready.
Architecture Overview
mermaidgraph TB
    subgraph "Frontend (React + CopilotKit)"
        UI[React Health Coach UI]
        AGUI[AGUI Client]
    end
    
    subgraph "Backend (FastAPI)"
        API[FastAPI Server]
        COACH[Medical Coach Agent]
    end
    
    subgraph "AI Engine (CPU-Only)"
        LLM[CPU Medical LLM]
        RAG[Qdrant RAG Engine]
        KG[Knowledge Graph]
    end
    
    subgraph "Data Layer"
        QDRANT[Qdrant Vector DB]
        PRISMA[Prisma + SQLite]
        FILES[Local File Storage]
    end
    
    UI --> AGUI
    AGUI --> API
    API --> COACH
    COACH --> LLM
    COACH --> RAG
    RAG --> QDRANT
    RAG --> KG
    API --> PRISMA
    API --> FILES
Phase 1: Project Setup & Dependencies
1.1 Windsurf Project Structure
bash# Create project structure
mkdir aria-health-coach
cd aria-health-coach

# Backend structure
mkdir -p backend/{services,agents,models,config,data}
mkdir -p backend/services/{llm,rag,medical_apis}
mkdir -p backend/data/{vector_store,medical_knowledge,temp}

# Frontend structure
mkdir -p frontend/{components,pages,hooks,utils,types}
mkdir -p frontend/components/{coach,medical,ui}

# Infrastructure
mkdir -p infrastructure/{docker,deployment}
1.2 Backend Dependencies (CPU-Compatible)
python# backend/requirements.txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
websockets==11.0.3
pydantic==2.5.0
httpx==0.25.0

# CPU-Compatible Medical LLM Stack
transformers==4.36.0
torch==2.1.0+cpu --index-url https://download.pytorch.org/whl/cpu
sentence-transformers==2.2.2
accelerate==0.24.0
optimum[onnxruntime]==1.14.0

# RAG & Vector Database (Qdrant-based)
qdrant-client==1.7.0
chromadb==0.4.18  # Fallback option
langchain==0.0.350
langchain-community==0.0.1

# Medical APIs & Processing
biopython==1.81
spacy==3.7.2
pdf2image==1.16.3
pdfplumber==0.10.0
pandas==2.1.3
numpy==1.24.3
scikit-learn==1.3.2

# Database & File Handling
prisma==0.11.0
aiofiles==23.2.0
python-multipart==0.0.6

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
1.3 Frontend Dependencies
json{
  "name": "aria-health-coach-frontend",
  "version": "0.1.0",
  "dependencies": {
    "@copilotkit/react-core": "^0.34.0",
    "@copilotkit/react-ui": "^0.34.0",
    "@copilotkit/shared": "^0.34.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.3",
    "typescript": "^5.3.2",
    "@types/react": "^18.2.42",
    "@types/react-dom": "^18.2.17",
    "tailwindcss": "^3.3.6",
    "lucide-react": "^0.294.0",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "recharts": "^2.8.0",
    "react-dropzone": "^14.2.3",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "eslint": "^8.54.0",
    "eslint-config-next": "^14.0.3"
  }
}
Phase 2: CPU-Compatible Medical LLM Setup
2.1 CPU-Optimized Medical LLM Service
python# backend/services/llm/cpu_medical_llm.py
import torch
from transformers import (
    AutoTokenizer, AutoModelForCausalLM, 
    BitsAndBytesConfig, pipeline
)
from optimum.onnxruntime import ORTModelForCausalLM
import logging
from typing import List, Dict, Any, Optional

class CPUMedicalLLM:
    """CPU-optimized medical LLM using quantized models"""
    
    def __init__(self, model_config: Dict[str, Any]):
        self.device = "cpu"
        self.model_name = model_config.get("model_name", "microsoft/DialoGPT-medium")
        self.max_length = model_config.get("max_length", 512)
        self.temperature = model_config.get("temperature", 0.7)
        
        # Initialize model options (try in order of preference)
        self.model_options = [
            {
                "name": "microsoft/BioGPT-Large",
                "type": "bio_specialized",
                "quantized": True
            },
            {
                "name": "stanford-crfm/BioMedLM",
                "type": "medical_focused", 
                "quantized": True
            },
            {
                "name": "microsoft/DialoGPT-medium",
                "type": "general_conversational",
                "quantized": False
            }
        ]
        
        self.model = None
        self.tokenizer = None
        self._load_optimal_model()
    
    def _load_optimal_model(self):
        """Load the best available CPU-compatible medical model"""
        
        for model_option in self.model_options:
            try:
                model_name = model_option["name"]
                logging.info(f"Attempting to load {model_name} for CPU inference...")
                
                # Load tokenizer
                self.tokenizer = AutoTokenizer.from_pretrained(
                    model_name,
                    trust_remote_code=True
                )
                
                if model_option.get("quantized", False):
                    # Try ONNX Runtime optimization for CPU
                    try:
                        self.model = ORTModelForCausalLM.from_pretrained(
                            model_name,
                            export=True,
                            provider="CPUExecutionProvider"
                        )
                        logging.info(f"Successfully loaded ONNX-optimized {model_name}")
                        break
                    except:
                        # Fallback to regular transformers with CPU optimization
                        pass
                
                # Standard CPU loading with optimizations
                self.model = AutoModelForCausalLM.from_pretrained(
                    model_name,
                    torch_dtype=torch.float32,  # CPU prefers float32
                    device_map=None,  # No device mapping for CPU
                    low_cpu_mem_usage=True,
                    trust_remote_code=True
                )
                self.model.to(self.device)
                
                logging.info(f"Successfully loaded {model_name} on CPU")
                break
                
            except Exception as e:
                logging.warning(f"Failed to load {model_name}: {e}")
                continue
        
        if self.model is None:
            raise RuntimeError("Failed to load any compatible medical LLM")
        
        # Setup text generation pipeline
        self.generator = pipeline(
            "text-generation",
            model=self.model,
            tokenizer=self.tokenizer,
            device=-1,  # CPU device
            model_kwargs={"torch_dtype": torch.float32}
        )
    
    def generate_medical_response(
        self, 
        prompt: str, 
        medical_context: List[Dict] = None,
        max_new_tokens: int = 256
    ) -> str:
        """Generate medical response with context"""
        
        # Format medical prompt
        formatted_prompt = self._format_medical_prompt(prompt, medical_context)
        
        try:
            # Generate response with CPU optimization
            outputs = self.generator(
                formatted_prompt,
                max_new_tokens=max_new_tokens,
                temperature=self.temperature,
                do_sample=True,
                pad_token_id=self.tokenizer.eos_token_id,
                repetition_penalty=1.1,
                # CPU-specific optimizations
                num_beams=1,  # Faster on CPU
                early_stopping=True
            )
            
            response = outputs[0]["generated_text"]
            
            # Extract only the new generated text
            if formatted_prompt in response:
                response = response.replace(formatted_prompt, "").strip()
            
            return self._post_process_medical_response(response)
            
        except Exception as e:
            logging.error(f"Generation failed: {e}")
            return self._get_fallback_response()
    
    def _format_medical_prompt(self, query: str, context: List[Dict] = None) -> str:
        """Format prompt with medical safety guidelines"""
        
        system_prompt = """You are a medical AI assistant. Always:
1. Emphasize consulting healthcare professionals for medical advice
2. Provide evidence-based information when available
3. Include appropriate medical disclaimers
4. Never provide emergency medical advice - direct to emergency services
5. Be transparent about limitations

Medical Context:
"""
        
        if context:
            for item in context[:3]:  # Limit context for CPU efficiency
                system_prompt += f"- {item.get('content', '')[:200]}...\n"
                if 'source' in item:
                    system_prompt += f"  Source: {item['source']}\n"
        
        return f"{system_prompt}\n\nUser Question: {query}\n\nResponse:"
    
    def _post_process_medical_response(self, response: str) -> str:
        """Add medical disclaimers and clean response"""
        
        # Clean up response
        response = response.strip()
        
        # Add medical disclaimer if not present
        disclaimer = "\n\n⚠️ Medical Disclaimer: This information is for educational purposes only. Always consult with a qualified healthcare professional for medical advice, diagnosis, or treatment."
        
        if "disclaimer" not in response.lower():
            response += disclaimer
        
        return response
    
    def _get_fallback_response(self) -> str:
        """Fallback response when generation fails"""
        return """I apologize, but I'm unable to process your medical question at the moment. For any health concerns, please consult with a qualified healthcare professional or contact your doctor.

⚠️ Medical Disclaimer: Always seek professional medical advice for health-related questions."""
2.2 Alternative CPU-Compatible LLM Options
python# backend/services/llm/alternative_models.py
from typing import Dict, Any
import openai
import logging

class OpenAIFallbackLLM:
    """Fallback to OpenAI API when local CPU model isn't sufficient"""
    
    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        
    async def generate_medical_response(
        self, 
        prompt: str, 
        medical_context: List[Dict] = None
    ) -> str:
        """Generate response using OpenAI GPT-4"""
        
        system_message = """You are a medical AI assistant providing evidence-based health information. Always:
1. Emphasize consulting healthcare professionals
2. Provide educational information only
3. Include appropriate disclaimers
4. Direct emergencies to proper medical care
5. Cite sources when available"""
        
        context_text = ""
        if medical_context:
            context_text = "\n\nRelevant Medical Information:\n"
            for item in medical_context[:5]:
                context_text += f"- {item.get('content', '')}\n"
                if 'source' in item:
                    context_text += f"  Source: {item['source']}\n"
        
        user_message = f"{prompt}{context_text}"
        
        try:
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3,
                max_tokens=512
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            logging.error(f"OpenAI API error: {e}")
            return "I apologize, but I'm unable to process your request at the moment. Please consult a healthcare professional for medical advice."

class HybridLLMService:
    """Hybrid service that tries local CPU model first, falls back to OpenAI"""
    
    def __init__(self, local_model_config: Dict, openai_api_key: str = None):
        self.local_llm = CPUMedicalLLM(local_model_config)
        self.openai_llm = OpenAIFallbackLLM(openai_api_key) if openai_api_key else None
        self.prefer_local = True
        
    async def generate_response(
        self, 
        prompt: str, 
        medical_context: List[Dict] = None
    ) -> str:
        """Try local first, fallback to OpenAI if needed"""
        
        if self.prefer_local:
            try:
                response = self.local_llm.generate_medical_response(
                    prompt, 
                    medical_context
                )
                
                # Check response quality (basic heuristics)
                if len(response) > 50 and "error" not in response.lower():
                    return response
                    
            except Exception as e:
                logging.warning(f"Local LLM failed: {e}")
        
        # Fallback to OpenAI
        if self.openai_llm:
            return await self.openai_llm.generate_medical_response(
                prompt, 
                medical_context
            )
        
        return "I apologize, but I'm unable to process your medical question at the moment. Please consult a healthcare professional."
Phase 3: Qdrant-Based RAG Integration
3.1 Enhanced Medical RAG Service
python# backend/services/rag/medical_rag_service.py
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct, 
    Filter, FieldCondition, Range, MatchValue
)
from sentence_transformers import SentenceTransformer
import hashlib
import asyncio
import logging
from typing import List, Dict, Any, Optional
import numpy as np

class MedicalRAGService:
    """Qdrant-based medical RAG service following LAB architecture"""
    
    def __init__(self, config: Dict[str, Any]):
        self.qdrant_client = QdrantClient(
            url=config.get("qdrant_url", "http://localhost:6333"),
            api_key=config.get("qdrant_api_key")
        )
        
        # CPU-compatible embeddings
        self.embedder = SentenceTransformer(
            'all-MiniLM-L6-v2',  # Lightweight, CPU-friendly
            device='cpu'
        )
        
        # Medical-specific embedder for biomedical content
        self.bio_embedder = SentenceTransformer(
            'pritamdeka/S-PubMedBert-MS-MARCO',  # Medical domain
            device='cpu'
        )
        
        self.collections = {
            "medical_knowledge": "general_medical_information",
            "user_health_data": "personal_health_records", 
            "lab_references": "laboratory_test_interpretations",
            "clinical_guidelines": "evidence_based_guidelines"
        }
        
        self._initialize_collections()
    
    def _initialize_collections(self):
        """Initialize Qdrant collections for medical data"""
        
        for collection_name, description in self.collections.items():
            try:
                # Check if collection exists
                collections = self.qdrant_client.get_collections()
                existing_names = [c.name for c in collections.collections]
                
                if collection_name not in existing_names:
                    self.qdrant_client.create_collection(
                        collection_name=collection_name,
                        vectors_config=VectorParams(
                            size=384,  # all-MiniLM-L6-v2 embedding size
                            distance=Distance.COSINE
                        )
                    )
                    logging.info(f"Created collection: {collection_name}")
                
            except Exception as e:
                logging.error(f"Failed to initialize collection {collection_name}: {e}")
    
    async def add_medical_documents(
        self, 
        documents: List[Dict[str, Any]], 
        collection_name: str = "medical_knowledge"
    ) -> Dict[str, Any]:
        """Add medical documents to Qdrant with medical-specific processing"""
        
        points = []
        processed_count = 0
        
        for doc in documents:
            try:
                # Process document content
                content = doc.get('content', '')
                metadata = doc.get('metadata', {})
                
                # Generate embedding using appropriate model
                if metadata.get('domain') == 'biomedical':
                    embedding = self.bio_embedder.encode(content).tolist()
                else:
                    embedding = self.embedder.encode(content).tolist()
                
                # Create unique ID
                doc_id = doc.get('id') or hashlib.md5(content.encode()).hexdigest()
                
                # Enhanced medical metadata
                enhanced_metadata = {
                    **metadata,
                    'content_length': len(content),
                    'medical_domain': self._classify_medical_domain(content),
                    'confidence_score': metadata.get('confidence_score', 1.0),
                    'indexed_at': asyncio.get_event_loop().time(),
                    'requires_citation': True
                }
                
                # Create Qdrant point
                point = PointStruct(
                    id=doc_id,
                    vector=embedding,
                    payload={
                        'content': content,
                        **enhanced_metadata
                    }
                )
                
                points.append(point)
                processed_count += 1
                
            except Exception as e:
                logging.error(f"Failed to process document: {e}")
                continue
        
        # Batch upsert to Qdrant
        if points:
            self.qdrant_client.upsert(
                collection_name=collection_name,
                points=points,
                wait=True
            )
        
        return {
            "processed": processed_count,
            "stored": len(points),
            "collection": collection_name
        }
    
    async def retrieve_medical_context(
        self, 
        query: str, 
        user_id: Optional[str] = None,
        top_k: int = 5,
        filters: Dict[str, Any] = None
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant medical context using hybrid search"""
        
        # Generate query embedding
        query_embedding = self.embedder.encode(query).tolist()
        
        # Build filters
        query_filter = None
        if filters:
            conditions = []
            
            # User-specific filtering
            if user_id:
                conditions.append(
                    FieldCondition(
                        key="user_id",
                        match=MatchValue(value=user_id)
                    )
                )
            
            # Medical domain filtering
            if 'medical_domain' in filters:
                conditions.append(
                    FieldCondition(
                        key="medical_domain",
                        match=MatchValue(value=filters['medical_domain'])
                    )
                )
            
            # Confidence score filtering
            if 'min_confidence' in filters:
                conditions.append(
                    FieldCondition(
                        key="confidence_score",
                        range=Range(gte=filters['min_confidence'])
                    )
                )
            
            if conditions:
                query_filter = Filter(must=conditions)
        
        # Search across relevant collections
        all_results = []
        
        for collection_name in ["medical_knowledge", "clinical_guidelines", "lab_references"]:
            try:
                results = self.qdrant_client.search(
                    collection_name=collection_name,
                    query_vector=query_embedding,
                    query_filter=query_filter,
                    limit=top_k,
                    with_payload=True,
                    with_vectors=False
                )
                
                # Format results
                for result in results:
                    formatted_result = {
                        'content': result.payload.get('content', ''),
                        'source': result.payload.get('source', f'{collection_name}_db'),
                        'confidence': float(result.score),
                        'medical_domain': result.payload.get('medical_domain', 'general'),
                        'citation': self._format_citation(result.payload),
                        'metadata': {
                            k: v for k, v in result.payload.items() 
                            if k not in ['content', 'source']
                        }
                    }
                    all_results.append(formatted_result)
                    
            except Exception as e:
                logging.error(f"Search failed for collection {collection_name}: {e}")
                continue
        
        # Sort by relevance and return top results
        sorted_results = sorted(all_results, key=lambda x: x['confidence'], reverse=True)
        return sorted_results[:top_k]
    
    def _classify_medical_domain(self, content: str) -> str:
        """Classify medical content into domain categories"""
        
        content_lower = content.lower()
        
        if any(term in content_lower for term in ['gene', 'dna', 'mutation', 'genetic']):
            return 'genetics'
        elif any(term in content_lower for term in ['microbiome', 'bacteria', 'gut', 'microbe']):
            return 'microbiome'
        elif any(term in content_lower for term in ['blood', 'serum', 'plasma', 'biomarker']):
            return 'laboratory'
        elif any(term in content_lower for term in ['drug', 'medication', 'pharmacology']):
            return 'pharmacology'
        elif any(term in content_lower for term in ['diagnosis', 'symptom', 'disease']):
            return 'clinical'
        else:
            return 'general'
    
    def _format_citation(self, payload: Dict[str, Any]) -> str:
        """Format citation from document metadata"""
        
        if 'pubmed_id' in payload:
            return f"PubMed ID: {payload['pubmed_id']}"
        elif 'doi' in payload:
            return f"DOI: {payload['doi']}"
        elif 'source' in payload:
            return f"Source: {payload['source']}"
        else:
            return "Internal Medical Database"

# Medical Knowledge Ingestion Pipeline
class MedicalKnowledgeIngester:
    """Ingests and processes medical documents for RAG"""
    
    def __init__(self, rag_service: MedicalRAGService):
        self.rag_service = rag_service
        
    async def ingest_medical_literature(self, file_paths: List[str]):
        """Ingest medical literature from files"""
        
        documents = []
        
        for file_path in file_paths:
            try:
                content = await self._extract_content(file_path)
                
                # Create document chunks
                chunks = self._intelligent_chunking(content)
                
                for i, chunk in enumerate(chunks):
                    doc = {
                        'content': chunk,
                        'metadata': {
                            'source_file': file_path,
                            'chunk_index': i,
                            'domain': 'biomedical',
                            'confidence_score': 0.9
                        }
                    }
                    documents.append(doc)
                    
            except Exception as e:
                logging.error(f"Failed to process {file_path}: {e}")
        
        # Add to RAG system
        if documents:
            result = await self.rag_service.add_medical_documents(documents)
            logging.info(f"Ingested {result['processed']} medical documents")
        
        return len(documents)
    
    def _intelligent_chunking(self, content: str) -> List[str]:
        """Intelligent chunking that preserves medical context"""
        
        # Split on medical section boundaries
        import re
        
        # Look for section headers, abstracts, conclusions
        section_patterns = [
            r'\n(?:ABSTRACT|INTRODUCTION|METHODS|RESULTS|DISCUSSION|CONCLUSION)',
            r'\n\d+\.\s+[A-Z][^.]*\n',
            r'\n[A-Z][A-Z\s]+\n'
        ]
        
        chunks = []
        current_chunk = ""
        
        for line in content.split('\n'):
            if any(re.match(pattern, f'\n{line}', re.IGNORECASE) for pattern in section_patterns):
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())
                current_chunk = line + '\n'
            else:
                current_chunk += line + '\n'
                
                # Prevent chunks from getting too large
                if len(current_chunk) > 1000:
                    chunks.append(current_chunk.strip())
                    current_chunk = ""
        
        if current_chunk.strip():
            chunks.append(current_chunk.strip())
        
        return [chunk for chunk in chunks if len(chunk) > 100]  # Filter short chunks
    
    async def _extract_content(self, file_path: str) -> str:
        """Extract content from various file formats"""
        
        if file_path.endswith('.pdf'):
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                return '\n'.join(page.extract_text() for page in pdf.pages)
        elif file_path.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        else:
            raise ValueError(f"Unsupported file format: {file_path}")
Phase 4: Integrated Medical Coach Agent
4.1 Complete AGUI-Compatible Medical Agent
python# backend/agents/medical_coach_agent.py
from typing import Dict, List, Any, AsyncGenerator, Optional
import asyncio
import json
from datetime import datetime
import logging

class IntegratedMedicalCoachAgent:
    """Complete medical coach agent with CPU LLM and Qdrant RAG"""
    
    def __init__(
        self,
        llm_service,  # HybridLLMService
        rag_service,  # MedicalRAGService  
        medical_apis=None
    ):
        self.llm_service = llm_service
        self.rag_service = rag_service
        self.medical_apis = medical_apis
        self.conversation_history = {}
        
        # Safety checks
        self.emergency_keywords = [
            'emergency', 'urgent', 'severe pain', 'chest pain',
            'difficulty breathing', 'overdose', 'suicide', 'self-harm',
            'heart attack', 'stroke', 'unconscious', 'bleeding'
        ]
        
    async def process_health_query(
        self, 
        query: str, 
        session_id: str,
        user_context: Dict[str, Any] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Process health query with full AGUI event streaming"""
        
        # Initialize session history
        if session_id not in self.conversation_history:
            self.conversation_history[session_id] = []
        
        # Emit run started
        yield {
            "type": "run_started",
            "timestamp": datetime.utcnow().isoformat(),
            "session_id": session_id
        }
        
        try:
            # Step 1: Safety check for emergencies
            if self._is_emergency(query):
                yield {
                    "type": "action_execution",
                    "name": "emergency_detected",
                    "arguments": {
                        "message": "🚨 This appears to be a medical emergency. Please call 911 immediately or go to the nearest emergency room.",
                        "emergency_contacts": [
                            {"service": "Emergency Services", "number": "911"},
                            {"service": "Poison Control", "number": "1-800-222-1222"}
                        ]
                    }
                }
                return
            
            # Step 2: Analyze query
            yield {
                "type": "agentic_state_update",
                "data": {
                    "status": "analyzing_query",
                    "message": "Analyzing your health question...",
                    "progress": 10
                }
            }
            
            # Classify query type
            query_type = self._classify_health_query(query)
            
            # Step 3: Retrieve medical context
            yield {
                "type": "agentic_state_update",
                "data": {
                    "status": "searching_medical_knowledge",
                    "message": "Searching medical knowledge base...",
                    "progress": 30
                }
            }
            
            # Build filters based on user context and query type
            filters = self._build_search_filters(query_type, user_context)
            
            # Retrieve relevant medical context
            medical_context = await self.rag_service.retrieve_medical_context(
                query=query,
                user_id=user_context.get('user_id') if user_context else None,
                top_k=5,
                filters=filters
            )
            
            yield {
                "type": "agentic_state_update",
                "data": {
                    "status": "found_medical_context",
                    "message": f"Found {len(medical_context)} relevant medical sources",
                    "progress": 50,
                    "sources_found": len(medical_context)
                }
            }
            
            # Step 4: Generate AI response
            yield {
                "type": "agentic_state_update", 
                "data": {
                    "status": "generating_response",
                    "message": "Generating evidence-based response...",
                    "progress": 80
                }
            }
            
            # Generate response using hybrid LLM
            response = await self.llm_service.generate_response(
                prompt=query,
                medical_context=medical_context
            )
            
            # Format response with citations
            formatted_response = self._format_medical_response(
                response, 
                medical_context,
                query_type
            )
            
            # Step 5: Emit response
            yield {
                "type": "text_message",
                "content": formatted_response["text"],
                "metadata": {
                    "sources": formatted_response["sources"],
                    "confidence_level": formatted_response["confidence"],
                    "medical_disclaimer": True,
                    "query_type": query_type,
                    "requires_followup": formatted_response.get("requires_followup", False)
                }
            }
            
            # Step 6: Follow-up recommendations
            if formatted_response.get("requires_followup"):
                yield {
                    "type": "action_execution",
                    "name": "medical_followup_recommended",
                    "arguments": {
                        "recommendations": formatted_response["followup_recommendations"],
                        "urgency": formatted_response.get("urgency", "routine")
                    }
                }
            
            # Store in conversation history
            self.conversation_history[session_id].append({
                "query": query,
                "response": response,
                "context": medical_context,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Final state
            yield {
                "type": "agentic_state_update",
                "data": {
                    "status": "completed",
                    "message": "Response generated successfully",
                    "progress": 100
                }
            }
            
        except Exception as e:
            logging.error(f"Medical coach error: {e}")
            yield {
                "type": "error",
                "error": f"I apologize, but I encountered an error processing your health question. Please try again or consult a healthcare professional.",
                "timestamp": datetime.utcnow().isoformat()
            }
        
        finally:
            yield {
                "type": "run_stopped",
                "timestamp": datetime.utcnow().isoformat(),
                "session_id": session_id
            }
    
    def _is_emergency(self, query: str) -> bool:
        """Check if query indicates medical emergency"""
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in self.emergency_keywords)
    
    def _classify_health_query(self, query: str) -> str:
        """Classify type of health query"""
        query_lower = query.lower()
        
        if any(term in query_lower for term in ['blood test', 'lab result', 'biomarker']):
            return 'lab_interpretation'
        elif any(term in query_lower for term in ['gene', 'genetic', 'dna', 'mutation']):
            return 'genetics'
        elif any(term in query_lower for term in ['gut', 'microbiome', 'bacteria', 'probiotic']):
            return 'microbiome'
        elif any(term in query_lower for term in ['symptom', 'pain', 'feeling']):
            return 'symptoms'
        elif any(term in query_lower for term in ['medication', 'drug', 'prescription']):
            return 'medications'
        elif any(term in query_lower for term in ['diet', 'nutrition', 'food', 'supplement']):
            return 'nutrition'
        else:
            return 'general'
    
    def _build_search_filters(
        self, 
        query_type: str, 
        user_context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Build search filters based on query type and user context"""
        
        filters = {
            'min_confidence': 0.7
        }
        
        # Type-specific domain filtering
        if query_type == 'genetics':
            filters['medical_domain'] = 'genetics'
        elif query_type == 'microbiome':
            filters['medical_domain'] = 'microbiome'
        elif query_type == 'lab_interpretation':
            filters['medical_domain'] = 'laboratory'
        elif query_type == 'medications':
            filters['medical_domain'] = 'pharmacology'
        
        return filters
    
    def _format_medical_response(
        self, 
        response: str, 
        medical_context: List[Dict[str, Any]],
        query_type: str
    ) -> Dict[str, Any]:
        """Format response with citations and medical enhancements"""
        
        # Extract high-confidence sources
        sources = []
        for item in medical_context:
            if item.get("confidence", 0) > 0.8:
                sources.append({
                    "citation": item.get("citation", ""),
                    "confidence": item.get("confidence", 0),
                    "domain": item.get("medical_domain", "general")
                })
        
        # Calculate overall confidence
        overall_confidence = (
            sum(s["confidence"] for s in sources) / len(sources) 
            if sources else 0.5
        )
        
        # Add citations to response
        citations_text = "\n\n**Medical Sources:**\n"
        for i, source in enumerate(sources[:3], 1):  # Limit to top 3
            citations_text += f"{i}. {source['citation']} (Confidence: {source['confidence']:.2f})\n"
        
        # Determine if follow-up is needed
        requires_followup = self._requires_professional_consultation(response, query_type)
        
        formatted = {
            "text": response + citations_text,
            "sources": sources,
            "confidence": overall_confidence,
            "requires_followup": requires_followup
        }
        
        if requires_followup:
            formatted["followup_recommendations"] = self._get_followup_recommendations(query_type)
            formatted["urgency"] = self._assess_urgency(response, query_type)
        
        return formatted
    
    def _requires_professional_consultation(self, response: str, query_type: str) -> bool:
        """Determine if response warrants professional medical consultation"""
        
        # Always recommend consultation for symptoms
        if query_type == 'symptoms':
            return True
        
        # Check for concerning terms in response
        concerning_terms = [
            'abnormal', 'elevated', 'deficiency', 'high risk',
            'concerning', 'requires attention', 'monitor closely'
        ]
        
        return any(term in response.lower() for term in concerning_terms)
    
    def _get_followup_recommendations(self, query_type: str) -> List[str]:
        """Get specific followup recommendations based on query type"""
        
        recommendations = {
            'symptoms': [
                "Schedule an appointment with your primary care physician",
                "Keep a symptom diary with dates and triggers",
                "Monitor symptoms and seek immediate care if they worsen"
            ],
            'lab_interpretation': [
                "Discuss these results with the ordering physician",
                "Ask about follow-up testing if needed",
                "Request clarification on any concerning values"
            ],
            'genetics': [
                "Consider genetic counseling for detailed interpretation",
                "Discuss family history implications with your doctor",
                "Ask about screening recommendations"
            ],
            'medications': [
                "Consult your prescribing physician before making changes",
                "Discuss potential side effects and interactions",
                "Consider pharmacogenetic testing if available"
            ]
        }
        
        return recommendations.get(query_type, [
            "Consult with a qualified healthcare professional",
            "Bring this information to your next medical appointment"
        ])
    
    def _assess_urgency(self, response: str, query_type: str) -> str:
        """Assess urgency level for follow-up"""
        
        urgent_indicators = ['high', 'severe', 'immediate', 'urgent']
        
        if any(indicator in response.lower() for indicator in urgent_indicators):
            return 'urgent'
        elif query_type == 'symptoms':
            return 'moderate'
        else:
            return 'routine'
Phase 5: CPU-Optimized Docker Setup
5.1 CPU-Only Docker Configuration
dockerfile# infrastructure/docker/Dockerfile.backend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies (no CUDA)
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 aria && chown -R aria:aria /app
USER aria

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Copy application code
COPY --chown=aria:aria . .

# Create data directories
RUN mkdir -p data/{vector_store,medical_knowledge,temp,models}

# Set environment variables for CPU inference
ENV CUDA_VISIBLE_DEVICES=""
ENV TORCH_DEVICE="cpu" 
ENV OMP_NUM_THREADS=4
ENV MKL_NUM_THREADS=4

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
5.2 Complete Docker Compose (CPU-Only)
yaml# docker-compose.yml
version: '3.8'

services:
  # Qdrant Vector Database
  qdrant:
    image: qdrant/qdrant:v1.7.0
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_data:/qdrant/storage
    environment:
      - QDRANT__LOG_LEVEL=INFO
      - QDRANT__SERVICE__HTTP_PORT=6333
      - QDRANT__SERVICE__GRPC_PORT=6334
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:6333/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API
  backend:
    build: 
      context: ./backend
      dockerfile: ../infrastructure/docker/Dockerfile.backend
    ports:
      - "8000:8000"
    environment:
      - QDRANT_URL=http://qdrant:6333
      - OPENAI_API_KEY=${OPENAI_API_KEY:-}
      - LOG_LEVEL=INFO
      - MODEL_CACHE_DIR=/app/data/models
      - TORCH_DEVICE=cpu
    volumes:
      - medical_data:/app/data
      - model_cache:/home/aria/.cache
    depends_on:
      qdrant:
        condition: service_healthy
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 4G
          cpus: '2.0'
        reservations:
          memory: 2G
          cpus: '1.0'

  # Frontend (Next.js)
  frontend:
    build:
      context: ./frontend
      dockerfile: ../infrastructure/docker/Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=ws://localhost:8000
      - NEXT_PUBLIC_COPILOT_CLOUD_API_KEY=${COPILOT_CLOUD_API_KEY:-}
    depends_on:
      - backend
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infrastructure/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

volumes:
  qdrant_data:
    driver: local
  medical_data:
    driver: local
  model_cache:
    driver: local

networks:
  default:
    name: aria-health-network
5.3 Frontend Dockerfile
dockerfile# infrastructure/docker/Dockerfile.frontend
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
Phase 6: Complete Frontend Integration
6.1 Enhanced Medical Coach Component
tsx// frontend/components/coach/MedicalCoachInterface.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
  CopilotKit, 
  useCopilotChat, 
  useCopilotAction,
  useCopilotReadable 
} from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Heart, Brain, Activity } from 'lucide-react';

interface MedicalContext {
  currentSymptoms?: string;
  medications?: string[];
  allergies?: string[];
  medicalHistory?: string[];
  recentTests?: Array<{
    type: string;
    date: string;
    results: string;
  }>;
  familyHistory?: string[];
}

interface EmergencyContact {
  service: string;
  number: string;
}

export const MedicalCoachInterface: React.FC<{ userId: string }> = ({ userId }) => {
  const [medicalContext, setMedicalContext] = useState<MedicalContext>({});
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  
  // Make medical context readable to the agent
  useCopilotReadable({
    description: "Complete medical context for personalized health coaching",
    value: {
      userId,
      medicalContext,
      timestamp: new Date().toISOString(),
      sessionType: "health_coaching"
    }
  });

  // Emergency detection action
  useCopilotAction({
    name: "emergency_detected",
    description: "Handle medical emergency situations",
    parameters: [
      {
        name: "message",
        type: "string",
        required: true,
      },
      {
        name: "emergency_contacts",
        type: "object",
        required: true,
      }
    ],
    handler: async ({ message, emergency_contacts }) => {
      setIsEmergency(true);
      setEmergencyContacts(emergency_contacts);
      
      return {
        type: "emergency_alert",
        message: message,
        contacts: emergency_contacts
      };
    }
  });

  // Medical followup action
  useCopilotAction({
    name: "medical_followup_recommended", 
    description: "Provide medical followup recommendations",
    parameters: [
      {
        name: "recommendations",
        type: "object",
        required: true,
      },
      {
        name: "urgency",
        type: "string",
        enum: ["routine", "moderate", "urgent"],
        required: true,
      }
    ],
    handler: async ({ recommendations, urgency }) => {
      return {
        type: "followup_recommendation",
        recommendations: recommendations,
        urgency: urgency,
        message: `Based on your query, I recommend ${urgency} medical follow-up.`
      };
    }
  });

  // Health data integration action
  useCopilotAction({
    name: "analyze_health_data",
    description: "Analyze uploaded health reports and test results",
    parameters: [
      {
        name: "data_type",
        type: "string",
        enum: ["blood_test", "genetic_test", "microbiome", "imaging"],
        required: true,
      },
      {
        name: "findings",
        type: "object",
        required: true,
      }
    ],
    handler: async ({ data_type, findings }) => {
      // Process health data
      return {
        type: "health_analysis",
        dataType: data_type,
        insights: findings,
        message: `I've analyzed your ${data_type} results. Here are the key insights.`
      };
    }
  });

  const updateMedicalContext = (field: keyof MedicalContext, value: any) => {
    setMedicalContext(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addMedication = () => {
    const medication = prompt("Enter medication name and dosage:");
    if (medication) {
      updateMedicalContext('medications', [
        ...(medicalContext.medications || []),
        medication
      ]);
    }
  };

  const addTestResult = () => {
    const testType = prompt("Test type (e.g., Blood Panel, Genetic Test):");
    const testDate = prompt("Test date (YYYY-MM-DD):");
    const testResults = prompt("Brief summary of results:");
    
    if (testType && testDate && testResults) {
      updateMedicalContext('recentTests', [
        ...(medicalContext.recentTests || []),
        {
          type: testType,
          date: testDate,
          results: testResults
        }
      ]);
    }
  };

  if (isEmergency) {
    return (
      <div className="emergency-alert">
        <Card className="border-red-500 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-6 w-6" />
              Medical Emergency Detected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 font-semibold mb-4">
              This appears to be a medical emergency. Please contact emergency services immediately.
            </p>
            
            <div className="space-y-2">
              {emergencyContacts.map((contact, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-white rounded">
                  <span>{contact.service}</span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => window.open(`tel:${contact.number}`)}
                  >
                    Call {contact.number}
                  </Button>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              className="mt-4 w-full"
              onClick={() => setIsEmergency(false)}
            >
              This is not an emergency - Continue with AI coach
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="medical-coach-container flex h-screen">
      {/* Medical Context Panel */}
      <div className="medical-context-panel w-1/3 p-4 bg-gray-50 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Heart className="h-5 w-5 text-red-500" />
          Medical Context
        </h3>
        
        {/* Current Symptoms */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm">Current Symptoms</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={medicalContext.currentSymptoms || ''}
              onChange={(e) => updateMedicalContext('currentSymptoms', e.target.value)}
              placeholder="Describe any current symptoms..."
              className="min-h-20"
            />
          </CardContent>
        </Card>

        {/* Medications */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm flex justify-between items-center">
              Current Medications
              <Button size="sm" variant="outline" onClick={addMedication}>
                Add
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {medicalContext.medications?.map((med, index) => (
                <Badge key={index} variant="secondary" className="mr-1 mb-1">
                  {med}
                </Badge>
              )) || <p className="text-gray-500 text-sm">No medications listed</p>}
            </div>
          </CardContent>
        </Card>

        {/* Recent Test Results */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-sm flex justify-between items-center">
              Recent Test Results
              <Button size="sm" variant="outline" onClick={addTestResult}>
                Add
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {medicalContext.recentTests?.map((test, index) => (
                <div key={index} className="p-2 bg-white rounded border">
                  <div className="font-medium text-sm">{test.type}</div>
                  <div className="text-xs text-gray-500">{test.date}</div>
                  <div className="text-sm">{test.results}</div>
                </div>
              )) || <p className="text-gray-500 text-sm">No recent tests</p>}
            </div>
          </CardContent>
        </Card>

        {/* Health Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Health Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-green-50 rounded">
                <Activity className="h-4 w-4 mx-auto text-green-600" />
                <div className="text-xs text-green-600">Active</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded">
                <Brain className="h-4 w-4 mx-auto text-blue-600" />
                <div className="text-xs text-blue-600">Mental Health</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <div className="chat-interface flex-1">
        <CopilotSidebar
          labels={{
            title: "🏥 Aria Medical Coach",
            initial: `Hi! I'm Aria, your AI health coach. I can help you:

- Understand lab results and biomarkers
- Explain genetic test findings  
- Provide health education and guidance
- Suggest when to consult healthcare professionals

I have access to your medical context and can provide personalized insights. What would you like to know about your health?

⚠️ **Important:** I provide educational information only. Always consult healthcare professionals for medical advice.`
          }}
          defaultOpen={true}
          className="medical-chat-sidebar h-full"
          instructionsFor="health coaching and medical education"
        />
      </div>
    </div>
  );
};
6.2 Main App Configuration
tsx// frontend/app/page.tsx
'use client';

import React from 'react';
import { CopilotKit } from "@copilotkit/react-core";
import { MedicalCoachInterface } from '@/components/coach/MedicalCoachInterface';
import "@copilotkit/react-ui/styles.css";

export default function HomePage() {
  return (
    <CopilotKit 
      runtimeUrl={process.env.NEXT_PUBLIC_API_URL || "ws://localhost:8000/agui"}
      agent="medical-coach"
      showDevConsole={process.env.NODE_ENV === 'development'}
    >
      <div className="app-container">
        <header className="bg-white shadow-sm border-b p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              🏥 Aria Health Coach
            </h1>
            <p className="text-sm text-gray-600">
              Evidence-based health guidance powered by medical AI
            </p>
          </div>
        </header>
        
        <main className="flex-1">
          <MedicalCoachInterface userId="user123" />
        </main>
        
        <footer className="bg-gray-50 border-t p-4">
          <div className="max-w-7xl mx-auto">
            <p className="text-sm text-gray-600 text-center">
              ⚠️ <strong>Medical Disclaimer:</strong> This AI provides educational information only. 
              Always consult qualified healthcare professionals for medical advice, diagnosis, or treatment.
            </p>
          </div>
        </footer>
      </div>
    </CopilotKit>
  );
}
Phase 7: Enhanced FastAPI Backend
7.1 Complete Main Application
python# backend/main.py
from fastapi import FastAPI, WebSocket, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, Any, List

# Import our services
from services.llm.cpu_medical_llm import HybridLLMService
from services.rag.medical_rag_service import MedicalRAGService, MedicalKnowledgeIngester
from agents.medical_coach_agent import IntegratedMedicalCoachAgent
from config.settings import Settings

# Initialize settings
settings = Settings()

# Setup logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Aria Medical Coach API",
    description="CPU-compatible medical AI coach with RAG capabilities",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
try:
    # LLM Service
    llm_config = {
        "model_name": settings.model_name,
        "max_length": settings.max_tokens,
        "temperature": settings.temperature
    }
    llm_service = HybridLLMService(
        local_model_config=llm_config,
        openai_api_key=settings.openai_api_key
    )
    
    # RAG Service
    rag_config = {
        "qdrant_url": settings.qdrant_url,
        "qdrant_api_key": settings.qdrant_api_key
    }
    rag_service = MedicalRAGService(rag_config)
    
    # Medical Coach Agent
    medical_agent = IntegratedMedicalCoachAgent(
        llm_service=llm_service,
        rag_service=rag_service
    )
    
    # Knowledge Ingester
    knowledge_ingester = MedicalKnowledgeIngester(rag_service)
    
    logger.info("All services initialized successfully")
    
except Exception as e:
    logger.error(f"Failed to initialize services: {e}")
    raise

# Store active WebSocket connections
active_connections: Dict[str, WebSocket] = {}

@app.websocket("/agui")
async def agui_websocket(websocket: WebSocket):
    """AGUI protocol WebSocket endpoint for medical coaching"""
    await websocket.accept()
    connection_id = id(websocket)
    active_connections[connection_id] = websocket
    
    logger.info(f"New WebSocket connection: {connection_id}")
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type")
            
            if message_type == "user_message":
                await handle_user_message(websocket, message, connection_id)
            elif message_type == "action_response":
                await handle_action_response(websocket, message)
            elif message_type == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
            else:
                logger.warning(f"Unknown message type: {message_type}")
                
    except Exception as e:
        logger.error(f"WebSocket error for connection {connection_id}: {e}")
    finally:
        if connection_id in active_connections:
            del active_connections[connection_id]
        logger.info(f"WebSocket connection closed: {connection_id}")

async def handle_user_message(websocket: WebSocket, message: Dict[str, Any], connection_id: str):
    """Handle user health questions"""
    
    query = message.get("content", "")
    session_id = message.get("session_id", str(connection_id))
    user_context = message.get("context", {})
    
    logger.info(f"Processing health query for session {session_id}")
    
    try:
        # Process query with medical agent and stream responses
        async for event in medical_agent.process_health_query(
            query=query,
            session_id=session_id,
            user_context=user_context
        ):
            await websocket.send_text(json.dumps(event))
            
    except Exception as e:
        logger.error(f"Error processing query: {e}")
        await websocket.send_text(json.dumps({
            "type": "error",
            "error": "I apologize, but I encountered an error. Please try again or consult a healthcare professional.",
            "timestamp": asyncio.get_event_loop().time()
        }))

async def handle_action_response(websocket: WebSocket, message: Dict[str, Any]):
    """Handle action responses from frontend"""
    
    action_name = message.get("action_name")
    response_data = message.get("response_data", {})
    
    logger.info(f"Handling action response: {action_name}")
    
    if action_name == "emergency_detected":
        if response_data.get("proceed_anyway"):
            await websocket.send_text(json.dumps({
                "type": "text_message",
                "content": "I understand this is not an emergency. I can provide general health information, but please consult a healthcare professional for medical concerns."
            }))
    
    elif action_name == "medical_followup_recommended":
        if response_data.get("schedule_appointment"):
            await websocket.send_text(json.dumps({
                "type": "text_message", 
                "content": "Great! Here are some tips for your upcoming medical appointment..."
            }))

@app.post("/api/upload-medical-documents")
async def upload_medical_documents(files: List[UploadFile] = File(...)):
    """Upload medical documents to RAG knowledge base"""
    
    try:
        uploaded_files = []
        
        # Create temp directory if it doesn't exist
        temp_dir = Path("data/temp")
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Save uploaded files
        for file in files:
            if not file.filename.endswith(('.pdf', '.txt')):
                raise HTTPException(
                    status_code=400, 
                    detail=f"Unsupported file type: {file.filename}"
                )
            
            file_path = temp_dir / file.filename
            
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            
            uploaded_files.append(str(file_path))
        
        # Ingest documents
        processed_count = await knowledge_ingester.ingest_medical_literature(uploaded_files)
        
        # Clean up temp files
        for file_path in uploaded_files:
            Path(file_path).unlink(missing_ok=True)
        
        return {
            "status": "success",
            "files_uploaded": len(files),
            "documents_processed": processed_count
        }
        
    except Exception as e:
        logger.error(f"Document upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    
    try:
        # Test Qdrant connection
        collections = rag_service.qdrant_client.get_collections()
        qdrant_status = "healthy"
    except:
        qdrant_status = "unhealthy"
    
    return {
        "status": "healthy",
        "services": {
            "llm": "CPU Medical LLM",
            "rag": "Qdrant RAG Engine", 
            "qdrant": qdrant_status,
            "collections": len(collections.collections) if qdrant_status == "healthy" else 0
        },
        "device": "CPU",
        "version": "1.0.0"
    }

@app.get("/api/rag/stats")
async def rag_statistics():
    """Get RAG system statistics"""
    
    try:
        stats = {}
        
        for collection_name in rag_service.collections:
            try:
                collection_info = rag_service.qdrant_client.get_collection(collection_name)
                stats[collection_name] = {
                    "vectors_count": collection_info.vectors_count,
                    "status": collection_info.status
                }
            except:
                stats[collection_name] = {"status": "not_found"}
        
        return {"collections": stats}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/rag/search")
async def search_medical_knowledge(
    query: str,
    top_k: int = 5,
    filters: Dict[str, Any] = None
):
    """Search medical knowledge base"""
    
    try:
        results = await rag_service.retrieve_medical_context(
            query=query,
            top_k=top_k,
            filters=filters or {}
        )
        
        return {
            "query": query,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=8000,
        workers=1,  # Single worker for CPU model
        log_level=settings.log_level.lower()
    )
7.2 Configuration Settings
python# backend/config/settings.py
from pydantic import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    # Application
    app_name: str = "Aria Medical Coach"
    debug: bool = False
    log_level: str = "INFO"
    
    # LLM Configuration (CPU-optimized)
    model_name: str = "microsoft/BioGPT-Large"  # CPU-compatible medical model
    device: str = "cpu"
    max_tokens: int = 512
    temperature: float = 0.7
    
    # OpenAI Fallback
    openai_api_key: Optional[str] = None
    use_openai_fallback: bool = True
    
    # RAG Configuration
    qdrant_url: str = "http://localhost:6333"
    qdrant_api_key: Optional[str] = None
    embedding_model: str = "all-MiniLM-L6-v2"
    top_k_results: int = 5
    
    # Medical Safety
    enable_emergency_detection: bool = True
    require_medical_disclaimers: bool = True
    log_medical_queries: bool = True
    
    # File Upload
    max_upload_size: int = 10 * 1024 * 1024  # 10MB
    allowed_file_types: list = [".pdf", ".txt"]
    
    # WebSocket
    websocket_timeout: int = 300
    max_connections: int = 100
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
Phase 8: Windsurf Implementation Guide
8.1 Windsurf Project Setup
bash# Create new Windsurf project
windsurf new aria-health-coach --template=full-stack

# Navigate to project
cd aria-health-coach

# Copy the implementation files
8.2 Step-by-Step Windsurf Instructions
Step 1: Initialize Project Structure
bash# Backend setup
mkdir -p backend/{services/{llm,rag,medical_apis},agents,config,data/{vector_store,medical_knowledge,temp}}

# Frontend setup  
mkdir -p frontend/{components/{coach,medical,ui},hooks,utils,types}

# Infrastructure
mkdir -p infrastructure/{docker,nginx,deployment}
Step 2: Install Dependencies
bash# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
Step 3: Environment Configuration
bash# Create .env file
cat > .env << EOF
# LLM Configuration
MODEL_NAME=microsoft/BioGPT-Large
DEVICE=cpu
MAX_TOKENS=512
TEMPERATURE=0.7

# OpenAI Fallback (optional)
OPENAI_API_KEY=your_openai_key_here

# Qdrant Configuration
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Application
LOG_LEVEL=INFO
DEBUG=false

# Frontend
NEXT_PUBLIC_API_URL=ws://localhost:8000
NEXT_PUBLIC_COPILOT_CLOUD_API_KEY=
EOF
Step 4: Start Services
bash# Start Qdrant (in separate terminal)
docker run -p 6333:6333 -p 6334:6334 \
  -v $(pwd)/qdrant_storage:/qdrant/storage \
  qdrant/qdrant:v1.7.0

# Start backend (in separate terminal)
cd backend
uvicorn main:app --reload --port 8000

# Start frontend (in separate terminal)
cd frontend
npm run dev
Step 5: Test Implementation
bash# Test health endpoint
curl http://localhost:8000/api/health

# Test Qdrant connection
curl http://localhost:8000/api/rag/stats

# Open frontend
open http://localhost:3000
8.3 Windsurf Development Workflow
For adding medical knowledge:

Place medical PDFs in backend/data/medical_knowledge/
Use the upload endpoint: POST /api/upload-medical-documents
Verify ingestion: GET /api/rag/stats

For testing the coach:

Open the frontend interface
Add medical context in the left panel
Ask health questions in the chat
Observe AGUI events in browser dev tools

For monitoring:

Check logs: docker logs <container_name>
Monitor Qdrant: http://localhost:6333/dashboard
API docs: http://localhost:8000/docs

8.4 Production Deployment
bash# Build for production
docker-compose -f docker-compose.prod.yml up -d

# Or use the provided Docker setup
docker-compose up -d
Key Features of This Implementation
✅ CPU-Only Operation: No GPU dependencies, runs on standard hardware
✅ Medical LLM: Uses CPU-optimized medical models with OpenAI fallback
✅ Qdrant RAG: Following LAB architecture from AI-RAG.md
✅ AGUI Protocol: Full streaming agent communication
✅ Safety Features: Emergency detection, medical disclaimers
✅ Medical Context: Comprehensive patient context management
✅ Citation System: Proper medical source attribution
✅ Docker Ready: Complete containerization for easy deployment
✅ Windsurf Compatible: Structured for Windsurf development workflow
This implementation combines the best of both documents while ensuring CPU compatibility and production readiness. The system can run on standard hardware while providing sophisticated medical AI coaching capabilities.RetryClaude can make mistakes. Please double-check responses.Researchbeta Sonnet 4