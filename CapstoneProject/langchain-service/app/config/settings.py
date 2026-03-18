import os
from dotenv import load_dotenv

load_dotenv()

# PostgreSQL connection
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:admin123@localhost:5432/rag_db")

# Vector store settings
VECTOR_STORE_PATH = os.getenv("VECTOR_STORE_PATH", "./chroma_db")
COLLECTION_NAME = os.getenv("COLLECTION_NAME", "pdf_documents")

# Ollama settings
# Options: "nomic-embed-text", "mxbai-embed-large", "snowflake-arctic-embed"
OLLAMA_MODEL = "mxbai-embed-large"

# Chunking settings (Legacy v1)
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200

# Semantic Chunking settings (v2 - Recommended)
SEMANTIC_CHUNK_SIZE = 800       # Nhỏ hơn để focused hơn
SEMANTIC_CHUNK_OVERLAP = 100    # Overlap vừa đủ
SEMANTIC_MIN_CHUNK_SIZE = 50    # Không tạo chunks quá nhỏ

# QA Optimized settings
QA_CHUNK_SIZE = 600             # Nhỏ hơn nữa cho Q&A
QA_CHUNK_OVERLAP = 50

# API settings
API_HOST = "0.0.0.0"
API_PORT = 8000

DEFAULT_ACADEMIC_YEAR = 2026
CURRENT_YEAR = 2026