
import pdfplumber
from typing import List
from langchain_core.documents import Document  

def extract_pdf_with_pdfplumber(file_path: str) -> List[Document]:
    documents = []
    
    try:
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                # Extract text từ page
                text = page.extract_text() or ""
                
                # Extract tables từ page
                tables = page.extract_tables()
                
                # Xây dựng nội dung page
                page_content = f"=== Trang {page_num} ===\n\n"
                
                # Thêm text
                if text.strip():
                    page_content += text + "\n\n"
                
                # Thêm tables với formatting
                if tables:
                    for table_idx, table in enumerate(tables, start=1):
                        page_content += f"--- BẢNG {table_idx} ---\n"
                        
                        # Format mỗi row của table
                        for row in table:
                            # Lọc bỏ None/empty cells và join với |
                            cells = [
                                str(cell).strip() if cell else "" 
                                for cell in row
                            ]
                            row_text = " | ".join(cells)
                            page_content += row_text + "\n"
                        
                        page_content += "\n"
                
                # Tạo Document object
                documents.append(Document(
                    page_content=page_content,
                    metadata={
                        "page": page_num,
                        "source": file_path,
                        "total_pages": len(pdf.pages)
                    }
                ))
        
        return documents
        
    except Exception as e:
        raise Exception(f"Lỗi khi extract PDF với pdfplumber: {str(e)}")


def extract_pdf_text_only(file_path: str) -> List[Document]:
    documents = []
    
    try:
        with pdfplumber.open(file_path) as pdf:
            for page_num, page in enumerate(pdf.pages, start=1):
                text = page.extract_text() or ""
                
                page_content = f"=== Trang {page_num} ===\n\n{text}"
                
                documents.append(Document(
                    page_content=page_content,
                    metadata={
                        "page": page_num,
                        "source": file_path
                    }
                ))
        
        return documents
        
    except Exception as e:
        raise Exception(f"Lỗi khi extract text từ PDF: {str(e)}")