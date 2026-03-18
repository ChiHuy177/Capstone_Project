"""
Debug script để kiểm tra vấn đề search
"""
from sqlalchemy import create_engine, text
from app.config import settings
import json

def debug_search():
    print("=" * 60)
    print("DEBUG SEARCH ISSUES")
    print("=" * 60)

    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        # 1. Kiểm tra có bao nhiêu records trong langchain_pg_embedding
        print("\n1. TỔNG SỐ RECORDS TRONG langchain_pg_embedding:")
        result = conn.execute(text("SELECT COUNT(*) FROM langchain_pg_embedding"))
        count = result.scalar()
        print(f"   Total records: {count}")

        if count == 0:
            print("   ⚠️ KHÔNG CÓ DATA! Cần upload PDF trước.")
            return

        # 2. Kiểm tra collection
        print("\n2. COLLECTIONS:")
        result = conn.execute(text("SELECT name, uuid FROM langchain_pg_collection"))
        for row in result:
            print(f"   - {row[0]} (uuid: {row[1]})")

        # 3. Xem sample metadata
        print("\n3. SAMPLE METADATA (5 records đầu):")
        result = conn.execute(text("""
            SELECT cmetadata
            FROM langchain_pg_embedding
            LIMIT 5
        """))
        for i, row in enumerate(result, 1):
            metadata = row[0]
            print(f"\n   Record {i}:")
            if metadata:
                for key, value in metadata.items():
                    print(f"      {key}: {value}")
            else:
                print("      (no metadata)")

        # 4. Kiểm tra is_active
        print("\n4. KIỂM TRA is_active:")
        result = conn.execute(text("""
            SELECT
                cmetadata->>'is_active' as is_active,
                COUNT(*) as count
            FROM langchain_pg_embedding
            GROUP BY cmetadata->>'is_active'
        """))
        for row in result:
            print(f"   is_active = {row[0]}: {row[1]} records")

        # 5. Kiểm tra academic_year
        print("\n5. KIỂM TRA academic_year:")
        result = conn.execute(text("""
            SELECT
                cmetadata->>'academic_year' as year,
                COUNT(*) as count
            FROM langchain_pg_embedding
            GROUP BY cmetadata->>'academic_year'
        """))
        for row in result:
            print(f"   academic_year = {row[0]}: {row[1]} records")

        # 6. Sample content
        print("\n6. SAMPLE CONTENT (3 records):")
        result = conn.execute(text("""
            SELECT
                LEFT(document, 200) as content_preview,
                cmetadata->>'source_file' as source
            FROM langchain_pg_embedding
            LIMIT 3
        """))
        for i, row in enumerate(result, 1):
            print(f"\n   Record {i} (source: {row[1]}):")
            print(f"   {row[0]}...")

        # 7. Test search không có filter
        print("\n7. TEST SEARCH KHÔNG FILTER:")
        print("   (Sử dụng raw SQL để bypass filter)")

        test_keyword = input("\n   Nhập từ khóa để test (hoặc Enter để skip): ").strip()
        if test_keyword:
            result = conn.execute(text(f"""
                SELECT
                    LEFT(document, 300) as content,
                    cmetadata->>'source_file' as source,
                    cmetadata->>'page' as page
                FROM langchain_pg_embedding
                WHERE document ILIKE :keyword
                LIMIT 5
            """), {"keyword": f"%{test_keyword}%"})

            rows = result.fetchall()
            if rows:
                print(f"\n   Tìm thấy {len(rows)} kết quả với từ khóa '{test_keyword}':")
                for i, row in enumerate(rows, 1):
                    print(f"\n   --- Result {i} ---")
                    print(f"   Source: {row[1]}, Page: {row[2]}")
                    print(f"   Content: {row[0]}...")
            else:
                print(f"\n   ❌ Không tìm thấy kết quả với từ khóa '{test_keyword}'")
                print("   → Có thể từ khóa không có trong database")


def test_vector_search():
    """Test vector search trực tiếp"""
    print("\n" + "=" * 60)
    print("TEST VECTOR SEARCH")
    print("=" * 60)

    from langchain_ollama import OllamaEmbeddings
    from langchain_postgres import PGVector

    print("\n1. Khởi tạo embeddings và vector store...")
    embeddings = OllamaEmbeddings(model=settings.OLLAMA_MODEL)

    vectorstore = PGVector(
        embeddings=embeddings,
        collection_name=settings.COLLECTION_NAME,
        connection=settings.DATABASE_URL,
        use_jsonb=True,
    )

    test_query = input("\n2. Nhập câu hỏi để test vector search: ").strip()
    if not test_query:
        test_query = "điểm chuẩn"

    # Test KHÔNG có filter
    print(f"\n3. Search '{test_query}' KHÔNG filter:")
    try:
        results = vectorstore.similarity_search_with_score(test_query, k=3)
        if results:
            for i, (doc, score) in enumerate(results, 1):
                print(f"\n   --- Result {i} (score: {score:.4f}) ---")
                print(f"   Metadata: {doc.metadata}")
                print(f"   Content: {doc.page_content[:200]}...")
        else:
            print("   ❌ Không có kết quả")
    except Exception as e:
        print(f"   ❌ Error: {e}")

    # Test CÓ filter is_active
    print(f"\n4. Search '{test_query}' VỚI filter is_active=True:")
    try:
        results = vectorstore.similarity_search_with_score(
            test_query,
            k=3,
            filter={"is_active": True}
        )
        if results:
            for i, (doc, score) in enumerate(results, 1):
                print(f"\n   --- Result {i} (score: {score:.4f}) ---")
                print(f"   Content: {doc.page_content[:200]}...")
        else:
            print("   ❌ Không có kết quả với filter is_active=True")
            print("   → Có thể metadata không có field is_active hoặc giá trị không phải True")
    except Exception as e:
        print(f"   ❌ Error: {e}")

    # Test với filter is_active string
    print(f"\n5. Search '{test_query}' VỚI filter is_active='true' (string):")
    try:
        results = vectorstore.similarity_search_with_score(
            test_query,
            k=3,
            filter={"is_active": "true"}
        )
        if results:
            print(f"   ✓ Tìm thấy {len(results)} kết quả")
        else:
            print("   ❌ Không có kết quả")
    except Exception as e:
        print(f"   ❌ Error: {e}")


if __name__ == "__main__":
    debug_search()

    run_vector_test = input("\n\nChạy test vector search? (y/n): ").strip().lower()
    if run_vector_test == 'y':
        test_vector_search()
