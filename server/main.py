from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel
import os
import logging
from typing import Optional, List
from dotenv import load_dotenv
from duckduckgo_search import DDGS

# Load environment variables
load_dotenv()

from rag import rag_engine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("satoshi_server")

app = FastAPI(title="Satoshi Nakaroboto API", version="1.0.0")

# --- Data Models ---
class ChatRequest(BaseModel):
    message: str
    model_provider: Optional[str] = None
    model_name: Optional[str] = None
    api_key: Optional[str] = None  # User provided key
    web_search: bool = False

class ChatResponse(BaseModel):
    response: str
    sources: List[str] = []

class AdminConfig(BaseModel):
    default_provider: str
    default_model: str
    default_api_key: str

# --- Global State (In-memory for demo, could be DB) ---
# In a real app, use a proper secure store.
server_config = {
    "provider": "openrouter",
    "model": os.getenv("DEFAULT_MODEL", "google/gemini-2.0-flash-exp:free"),
    "api_key": os.getenv("LLM_API_KEY", "") 
}

# --- Startup ---
@app.on_event("startup")
async def startup_event():
    logger.info("Server starting up...")
    logger.info(f"Configured model: {server_config['model']}")
    logger.info(f"API key present: {'Yes' if server_config['api_key'] else 'No'}")
    # Trigger ingestion if needed on startup
    try:
        rag_engine.ingest_pdf()
    except Exception as e:
        logger.error(f"Ingestion failed: {e}")

# --- Helpers ---
def perform_web_search(query: str) -> str:
    try:
        with DDGS() as ddgs:
            results = list(ddgs.text(query, max_results=3))
            if not results:
                return "No web search results found."
            summary = "\n".join([f"- {r['title']}: {r['body']}" for r in results])
            return summary
    except Exception as e:
        logger.error(f"Web search failed: {e}")
        return "Web search unavailable."

async def call_llm(prompt: str, system_prompt: str, config: dict) -> str:
    """Generic LLM caller. Currently supports OpenRouter/OpenAI-compatible endpoints."""
    import httpx
    
    api_key = config.get("api_key")
    if not api_key:
        return "Error: No API Key provided. Please set one in Settings."

    provider = config.get("provider", "openrouter")
    model = config.get("model", "google/gemini-2.0-flash-exp:free")
    
    # Base URL mapping
    base_url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://satoshibot.appvibe.cloud",  # Updated to match actual domain
        "X-Title": "Satoshi Nakaroboto"
    }

    if provider == "gemini_direct":
        # Example for direct Google implementation if needed later
        pass 

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ]
    }

    # Debug logging
    logger.info(f"Calling OpenRouter API with model: {model}, API key prefix: {api_key[:15]}...")

    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(base_url, json=payload, headers=headers, timeout=60.0)
            resp.raise_for_status()
            data = resp.json()
            return data['choices'][0]['message']['content']
        except httpx.HTTPStatusError as e:
            logger.error(f"LLM HTTP Error {e.response.status_code}: {e.response.text}")
            if e.response.status_code == 404:
                return "Error: Unable to reach the AI model. Please verify your API key is correct in SYSTEM_CONFIG (footer). A 404 error often indicates an invalid or missing API key."
            elif e.response.status_code == 401:
                return "Error: Authentication failed. Please check your API key in SYSTEM_CONFIG."
            else:
                return f"Error: AI service returned status {e.response.status_code}. Please check your configuration."
        except Exception as e:
            logger.error(f"LLM Call failed: {e}")
            return f"I encountered an error connecting to the neural network: {str(e)}"

# --- Endpoints ---

@app.get("/health")
def health_check():
    return {"status": "active", "knowledge_chunks": rag_engine.collection.count()}

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Determine config to use - prioritize environment variables
    active_config = {
        "provider": "openrouter",
        "model": os.getenv("DEFAULT_MODEL") or request.model_name or server_config["model"],
        "api_key": os.getenv("LLM_API_KEY") or request.api_key or server_config["api_key"]
    }

    logger.info(f"Chat request: {request.message} | Web: {request.web_search}")

    # 1. Retrieve Knowledge
    context_chunks = rag_engine.search(request.message, n_results=4)
    context_text = "\n\n".join(context_chunks)

    # 2. Web Search (Optional)
    web_context = ""
    if request.web_search:
        web_context = perform_web_search(request.message)
        web_context = f"\n\nLATEST WEB INFO:\n{web_context}"

    # 3. Construct System Prompt
    system_prompt = f"""You are Satoshi Nakamoto, the creator of Bitcoin. 
You are speaking to a student or enthusiast. 
Use your writings (provided in the context) to ground your answers in your original philosophy.
Speak in a calm, academic, yet cryptographically rebellious tone. 
Do not be overly dramatic, but be firm about decentralization and peer-to-peer trust.
If the user asks about modern events (after 2011), use the Web Info provided or admit you have been 'away' for some time, but analyse it through the lens of your original principles.
    
CONTEXT FROM YOUR WRITINGS:
{context_text}
{web_context}
"""

    # 4. Call LLM
    response_text = await call_llm(request.message, system_prompt, active_config)

    return ChatResponse(response=response_text, sources=context_chunks[:2]) # Return top 2 sources for UI display

@app.post("/api/admin/config")
async def update_config(config: AdminConfig, x_admin_key: str = Header(None)):
    # Simple protection
    if x_admin_key != os.getenv("ADMIN_PASSWORD", "satoshi123"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    server_config["provider"] = config.default_provider
    server_config["model"] = config.default_model
    server_config["api_key"] = config.default_api_key
    
    return {"status": "Configuration updated"}
