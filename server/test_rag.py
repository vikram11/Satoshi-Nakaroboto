import sys
import os

# Ensure we can import from local directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag import rag_engine

def test_rag():
    print("Initializing RAG...")
    # This should trigger ingestion if empty
    rag_engine.ingest_pdf()
    
    query = "What is the problem with conventional currency?"
    print(f"\nQuerying: {query}")
    
    results = rag_engine.search(query)
    
    if not results:
        print("FAILED: No results found.")
        sys.exit(1)
        
    print(f"SUCCESS: Found {len(results)} chunks.")
    print("Top result snippet:")
    print(results[0][:200])

if __name__ == "__main__":
    test_rag()
