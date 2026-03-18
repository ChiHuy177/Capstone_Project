"""
Script xóa embeddings cũ để re-upload với model mới
"""
from sqlalchemy import create_engine, text
from app.config import settings

def clear_embeddings():
    print("=" * 60)
    print("CLEAR OLD EMBEDDINGS")
    print("=" * 60)

    engine = create_engine(settings.DATABASE_URL)

    with engine.connect() as conn:
        # 1. Đếm records hiện tại
        result = conn.execute(text("SELECT COUNT(*) FROM langchain_pg_embedding"))
        count = result.scalar()
        print(f"\nSố records hiện tại: {count}")

        if count == 0:
            print("Không có data để xóa.")
            return

        # 2. Xác nhận
        confirm = input(f"\nBạn có chắc muốn xóa {count} embeddings? (yes/no): ").strip().lower()

        if confirm != 'yes':
            print("Đã hủy.")
            return

        # 3. Xóa embeddings
        print("\nĐang xóa embeddings...")
        conn.execute(text("DELETE FROM langchain_pg_embedding"))
        conn.commit()
        print("✓ Đã xóa embeddings")

        # 4. Xóa documents (optional)
        clear_docs = input("\nXóa luôn bảng documents? (yes/no): ").strip().lower()
        if clear_docs == 'yes':
            conn.execute(text("DELETE FROM documents"))
            conn.commit()
            print("✓ Đã xóa documents")

        # 5. Reset collection (optional)
        reset_collection = input("\nReset collection? (yes/no): ").strip().lower()
        if reset_collection == 'yes':
            conn.execute(text("DELETE FROM langchain_pg_collection"))
            conn.commit()
            print("✓ Đã reset collection")

        print("\n" + "=" * 60)
        print("HOÀN THÀNH!")
        print("=" * 60)
        print("\nBước tiếp theo:")
        print("1. Restart Python service: python main.py")
        print("2. Re-upload PDF files")


if __name__ == "__main__":
    clear_embeddings()
