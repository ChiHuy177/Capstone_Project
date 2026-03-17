"""
Test Hybrid Search
"""
from app.services.pdf_service import pdf_service

def test_search():
    print("=" * 60)
    print("TEST HYBRID SEARCH")
    print("=" * 60)

    test_queries = [
        "Giảng đường và phòng học ở EIU",
        "GIẢNG ĐƯỜNG, PHÒNG HỌC",
        "Diện tích EIU",
        "Sinh viên được chăm sóc sức khỏe",
        "STEM LAB",
        "Doanh nghiệp hợp tác với EIU"
    ]

    for query in test_queries:
        print(f"\n{'='*60}")
        print(f"Query: {query}")
        print("=" * 60)

        result = pdf_service.search_documents(query, top_k=3)

        if result["results"]:
            for i, r in enumerate(result["results"], 1):
                print(f"\n--- Result {i} (score: {r['score']:.4f}) ---")
                print(f"Content: {r['content'][:200]}...")
        else:
            print("Không có kết quả")


if __name__ == "__main__":
    test_search()
