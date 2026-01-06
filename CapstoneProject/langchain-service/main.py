from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import os
from dotenv import load_dotenv

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import Chroma

load_dotenv()

app = FastAPI(title="LangChain PDF Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Embeddings - Ollama (miễn phí, local)
print("Đang khởi tạo Ollama embeddings...")
embeddings = OllamaEmbeddings(
    model="nomic-embed-text"
)
print("Ollama embeddings sẵn sàng!")

VECTOR_STORE_PATH = os.getenv("VECTOR_STORE_PATH", "./chroma_db")

# Models
class ProcessPdfResponse(BaseModel):
    success: bool
    message: str
    document_id: str
    num_chunks: int

class SearchResponse(BaseModel):
    results: List[dict]

@app.get("/")
def read_root():
    return {"message": "LangChain PDF Service with Ollama is running", "status": "ok"}

@app.post("/api/pdf/process")
async def process_pdf(file: UploadFile = File(...)):
    try:
        os.makedirs("./temp", exist_ok=True)
        temp_file_path = f"./temp/{file.filename}"
        
        with open(temp_file_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        loader = PyPDFLoader(temp_file_path)
        pages = loader.load()
        
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
        )
        chunks = text_splitter.split_documents(pages)
        
        document_id = file.filename.replace(".pdf", "")
        for i, chunk in enumerate(chunks):
            chunk.metadata.update({
                "document_id": document_id,
                "chunk_index": i,
                "source_file": file.filename
            })
        
        vectorstore = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=VECTOR_STORE_PATH,
            collection_name="pdf_documents"
        )
        
        os.remove(temp_file_path)
        
        return {
            "success": True,
            "message": "PDF processed successfully",
            "document_id": document_id,
            "num_chunks": len(chunks)
        }
        
    except Exception as e:
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/pdf/search")
async def search_documents(query: str, top_k: int = 5):
    try:
        vectorstore = Chroma(
            persist_directory=VECTOR_STORE_PATH,
            embedding_function=embeddings,
            collection_name="pdf_documents"
        )
        
        results = vectorstore.similarity_search_with_score(query, k=top_k)
        
        formatted_results = [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score)
            }
            for doc, score in results
        ]
        
        return {"results": formatted_results}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)