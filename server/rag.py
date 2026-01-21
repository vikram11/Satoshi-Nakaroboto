import os
import logging
from typing import List, Optional
import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from pypdf import PdfReader

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Constants
VECTOR_DB_PATH = "./data/chroma_db"
COLLECTION_NAME = "satoshi_knowledge"
MODEL_NAME = "all-MiniLM-L6-v2"
PDF_PATH = "../BookOfSatoshi.pdf"

class RAGEngine:
    def __init__(self):
        self.chroma_client = chromadb.PersistentClient(path=VECTOR_DB_PATH)
        self.collection = self.chroma_client.get_or_create_collection(name=COLLECTION_NAME)
        self.embedding_model = SentenceTransformer(MODEL_NAME)
        logger.info(f"RAG Engine initialized. Collection count: {self.collection.count()}")

    def ingest_pdf(self, pdf_path: str = PDF_PATH) -> None:
        """Reads PDF, chunks text, creates embeddings, and stores in ChromaDB."""
        if self.collection.count() > 0:
            logger.info("Collection already has data. Skipping ingestion. (Delete 'data' folder to re-ingest)")
            return

        if not os.path.exists(pdf_path):
            logger.error(f"PDF not found at {pdf_path}")
            return

        logger.info(f"Starting ingestion of {pdf_path}...")
        reader = PdfReader(pdf_path)
        chunks = []
        metadatas = []
        ids = []
        
        # Simple chunking strategy
        chunk_size = 1000
        overlap = 100
        
        full_text = ""
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                full_text += text + "\n"
        
        # Split text into chunks
        # Note: robust splitters like LangChain's RecursiveCharacterTextSplitter are better, 
        # but to keep deps minimal we use a simple sliding window here or we could add langchain-text-splitters
        # For this demo, let's just do a simple character split.
        
        current_pos = 0
        total_len = len(full_text)
        
        chunk_counter = 0
        while current_pos < total_len:
            end_pos = min(current_pos + chunk_size, total_len)
            chunk_text = full_text[current_pos:end_pos]
            
            chunks.append(chunk_text)
            metadatas.append({"source": "BookOfSatoshi.pdf", "chunk_id": chunk_counter})
            ids.append(f"chunk_{chunk_counter}")
            
            current_pos += (chunk_size - overlap)
            chunk_counter += 1

        logger.info(f"Created {len(chunks)} chunks. Generating embeddings...")
        
        # Batch processing for embeddings
        batch_size = 64
        for i in range(0, len(chunks), batch_size):
            batch_chunks = chunks[i:i+batch_size]
            batch_ids = ids[i:i+batch_size]
            batch_metadatas = metadatas[i:i+batch_size]
            
            embeddings = self.embedding_model.encode(batch_chunks).tolist()
            
            self.collection.add(
                embeddings=embeddings,
                documents=batch_chunks,
                metadatas=batch_metadatas,
                ids=batch_ids
            )
            logger.info(f"Processed batch {i//batch_size + 1}/{(len(chunks)-1)//batch_size + 1}")

        logger.info("Ingestion complete.")

    def search(self, query: str, n_results: int = 5) -> List[str]:
        """Semantically searches the vector store for relevant chunks."""
        query_embedding = self.embedding_model.encode([query]).tolist()
        results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=n_results
        )
        # results['documents'] is a list of list of strings
        if results and results['documents']:
            return results['documents'][0]
        return []

# Singleton instance for easy import
rag_engine = RAGEngine()

if __name__ == "__main__":
    # Allow running this script directly to force ingestion
    rag_engine.ingest_pdf()
    
    # Test query
    results = rag_engine.search("What is Bitcoin?")
    print("\n--- Search Results for 'What is Bitcoin?' ---")
    for res in results:
        print(f"- {res[:100]}...")
