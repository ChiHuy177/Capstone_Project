import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:admin123@localhost:5432/rag_db")

# Vector store settings
VECTOR_STORE_PATH = os.getenv("VECTOR_STORE_PATH", "./chroma_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "pdf_documents")

# Ollama settings
OLLAMA_MODEL = "nomic-embed-text"

# Chunking settings
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# API settings
API_HOST = "0.0.0.0"
API_PORT = 8000

DEFAULT_ACADEMIC_YEAR = 2026 
CURRENT_YEAR = 2026