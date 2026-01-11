from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import pdf_router

# Tạo FastAPI app
app = FastAPI(title="LangChain PDF Service")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Thêm routers
app.include_router(pdf_router.router)

@app.get("/")
def read_root():
    """Health check"""
    return {
        "message": "LangChain PDF Service with Ollama is running",
        "status": "ok"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.API_HOST,
        port=settings.API_PORT
    )
