"""
ChromaDB Vector Store Implementation for HIPAA-compliant Health AI Assistant
Provides local-only vector storage with no external API dependencies
"""
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
import hashlib
import json
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import numpy as np
import logging
import os

class HealthVectorStore:
    """
    ChromaDB Vector Store for Health Data
    
    Manages document storage and retrieval using local embeddings for HIPAA compliance
    No data leaves the local system, suitable for working with protected health information
    """
    def __init__(self, persist_directory: str = "./chroma_db"):
        """
        Initialize ChromaDB with local storage for HIPAA compliance
        
        Args:
            persist_directory: Local directory to store vector database
        """
        # Configure logging
        self.logger = logging.getLogger(__name__)
        
        # Ensure persistence directory exists
        os.makedirs(persist_directory, exist_ok=True)
        
        # Initialize sentence transformer for embeddings
        # Using all-MiniLM-L6-v2 which is lightweight and runs well on CPU
        self.logger.info("Initializing sentence transformer model")
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')
        
        # Initialize ChromaDB with local persistence
        self.logger.info(f"Initializing ChromaDB in {persist_directory}")
        self.client = chromadb.PersistentClient(
            path=persist_directory,
            settings=Settings(
                anonymized_telemetry=False,  # Disable telemetry for HIPAA compliance
                allow_reset=False            # Safety measure to prevent data loss
            )
        )
        
        # Create collections for different data types
        self.collections = {
            'dna': self._create_or_get_collection('dna_insights'),
            'microbiome': self._create_or_get_collection('microbiome_data'),
            'biomarkers': self._create_or_get_collection('biomarker_results'),
            'correlations': self._create_or_get_collection('health_correlations'),
            'recommendations': self._create_or_get_collection('ai_recommendations'),
            'chat_memory': self._create_or_get_collection('conversation_history')
        }
        
        self.logger.info("HealthVectorStore initialized successfully")
    
    def _create_or_get_collection(self, name: str):
        """
        Create or get a ChromaDB collection
        
        Args:
            name: Collection name
            
        Returns:
            ChromaDB collection object
        """
        try:
            collection = self.client.get_collection(name)
            self.logger.debug(f"Retrieved existing collection: {name}")
            return collection
        except Exception as e:
            self.logger.info(f"Creating new collection: {name}")
            return self.client.create_collection(
                name=name,
                metadata={"hnsw:space": "cosine"}  # Use cosine similarity for health data
            )
    
    def embed_text(self, text: str) -> List[float]:
        """
        Generate embeddings using local sentence transformer model
        
        Args:
            text: Text to embed
            
        Returns:
            List of floating point values representing the embedding
        """
        return self.embedder.encode(text).tolist()
    
    def add_health_data(self, 
                       collection_name: str,
                       data: Dict[str, Any],
                       user_id: str,
                       metadata: Optional[Dict] = None) -> str:
        """
        Add health data to vector store with encryption-ready structure
        
        Args:
            collection_name: Target collection ('dna', 'biomarkers', etc)
            data: Health data dictionary
            user_id: User identifier
            metadata: Additional metadata
            
        Returns:
            Document ID for the added data
        """
        collection = self.collections.get(collection_name)
        if not collection:
            error_msg = f"Collection {collection_name} not found"
            self.logger.error(error_msg)
            raise ValueError(error_msg)
        
        # Generate unique document ID
        doc_id = hashlib.sha256(
            f"{user_id}_{collection_name}_{datetime.now().isoformat()}_{json.dumps(data)}".encode()
        ).hexdigest()[:16]
        
        # Format and embed document
        text_content = self._format_data_for_embedding(data, collection_name)
        embedding = self.embed_text(text_content)
        
        # Enhanced metadata for filtering and security
        full_metadata = {
            "user_id": user_id,
            "data_type": collection_name,
            "timestamp": datetime.now().isoformat(),
            "doc_type": "health_data"
        }
        
        # Add any additional metadata
        if metadata:
            full_metadata.update(metadata)
        
        try:
            # Add to ChromaDB
            collection.add(
                embeddings=[embedding],
                documents=[text_content],
                metadatas=[full_metadata],
                ids=[doc_id]
            )
            self.logger.info(f"Added document {doc_id} to collection {collection_name}")
            
            return doc_id
        except Exception as e:
            self.logger.error(f"Error adding document to vector store: {e}")
            raise
    
    def _format_data_for_embedding(self, data: Dict, data_type: str) -> str:
        """
        Format health data for embedding generation
        
        Args:
            data: Health data dictionary
            data_type: Type of health data
            
        Returns:
            Formatted string ready for embedding
        """
        if data_type == 'dna':
            return f"DNA Analysis: {data.get('gene', 'Unknown gene')}, " \
                   f"Variant: {data.get('variant', 'Unknown')}, " \
                   f"Impact: {data.get('impact', 'Unknown impact')}, " \
                   f"Description: {data.get('description', '')}"
                   
        elif data_type == 'microbiome':
            return f"Microbiome: {data.get('organism', 'Unknown organism')}, " \
                   f"Abundance: {data.get('abundance', 'Unknown')}, " \
                   f"Impact: {data.get('impact', 'Unknown impact')}"
                   
        elif data_type == 'biomarkers':
            return f"Biomarker: {data.get('name', 'Unknown biomarker')}, " \
                   f"Value: {data.get('value', 'Unknown')} " \
                   f"{data.get('unit', '')} (reference: {data.get('reference_range', 'Unknown')})"
        
        else:
            return json.dumps(data)
    
    def semantic_search(self,
                       query: str,
                       collection_names: List[str],
                       user_id: str,
                       top_k: int = 10) -> List[Dict]:
        """
        Perform semantic search across specified collections
        
        Args:
            query: Search query
            collection_names: List of collection names to search
            user_id: User identifier for filtering
            top_k: Number of results to return
            
        Returns:
            List of matching documents with relevance scores
        """
        # Generate query embedding
        query_embedding = self.embed_text(query)
        
        all_results = []
        
        # Search each specified collection
        for name in collection_names:
            if name not in self.collections:
                self.logger.warning(f"Collection {name} not found, skipping")
                continue
                
            collection = self.collections[name]
            
            # Query with user filter for security
            try:
                results = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=top_k,
                    where={"user_id": user_id}
                )
                
                # No results found
                if not results or not results.get('ids') or len(results['ids']) == 0:
                    continue
                    
                # Process results
                for i, doc_id in enumerate(results['ids'][0]):
                    all_results.append({
                        'id': doc_id,
                        'content': results['documents'][0][i],
                        'metadata': results['metadatas'][0][i],
                        'collection': name,
                        'distance': results['distances'][0][i] if 'distances' in results else 0
                    })
            except Exception as e:
                self.logger.error(f"Error searching collection {name}: {e}")
        
        # Sort by relevance (lower distance means more relevant)
        return sorted(all_results, key=lambda x: x['distance'])
    
    def get_document_by_id(self, collection_name: str, doc_id: str) -> Dict:
        """
        Retrieve a document by ID
        
        Args:
            collection_name: Collection to search in
            doc_id: Document ID
            
        Returns:
            Document data or empty dict if not found
        """
        collection = self.collections.get(collection_name)
        if not collection:
            self.logger.error(f"Collection {collection_name} not found")
            return {}
            
        try:
            result = collection.get(ids=[doc_id])
            if not result or not result.get('ids') or len(result['ids']) == 0:
                return {}
                
            return {
                'id': result['ids'][0],
                'content': result['documents'][0],
                'metadata': result['metadatas'][0] if 'metadatas' in result else {}
            }
        except Exception as e:
            self.logger.error(f"Error retrieving document {doc_id}: {e}")
            return {}
    
    def delete_user_data(self, user_id: str) -> bool:
        """
        Delete all data for a specific user (for GDPR/HIPAA compliance)
        
        Args:
            user_id: User identifier
            
        Returns:
            Success status
        """
        success = True
        for name, collection in self.collections.items():
            try:
                collection.delete(where={"user_id": user_id})
                self.logger.info(f"Deleted user {user_id} data from collection {name}")
            except Exception as e:
                self.logger.error(f"Error deleting user {user_id} data from {name}: {e}")
                success = False
        
        return success
