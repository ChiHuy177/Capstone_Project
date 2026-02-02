
from sqlalchemy import Boolean, create_engine, Column, String, Integer, BigInteger, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
import uuid
from app.config import settings

# Create engine
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class Document(Base):
    """Model cho bảng documents"""
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_size = Column(BigInteger)
    content_type = Column(String(100), default='application/pdf')
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    uploaded_by = Column(String(100))
    status = Column(String(50), default='processing')
    total_pages = Column(Integer)
    total_chunks = Column(Integer)
    error_message = Column(Text)
    doc_metadata = Column('metadata', JSONB)  
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    academic_year = Column(Integer, nullable=True, comment='Năm học (VD: 2025, 2026)')
    is_active = Column(Boolean, default=False, comment='Document active hay không')

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()