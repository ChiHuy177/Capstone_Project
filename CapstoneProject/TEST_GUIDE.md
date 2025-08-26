# Hướng dẫn Test Project Chat System

## Trạng thái hiện tại

- **Server**: Đang chạy trên `https://localhost:5026`
- **Client**: Đang chạy trên `https://localhost:54410`
- **Database**: MySQL đã được tạo và cấu hình
- **SignalR**: Đã cấu hình CORS và HTTPS

## 🧪 Các bước test

### 1. Test Chat Widget

1. **Mở browser** và truy cập: `https://localhost:54410`
2. **Tìm chat bubble** ở góc phải dưới (icon 💬)
3. **Click vào chat bubble** để mở chat window
4. **Gửi tin nhắn test**:
   - "hello" → Sẽ nhận được: "Xin chào! Tôi có thể giúp gì cho bạn?"
   - "help" → Sẽ nhận được: "Tôi có thể giúp bạn với các vấn đề về công nghệ, lập trình, hoặc bất kỳ câu hỏi nào khác."
   - "how are you" → Sẽ nhận được: "Tôi đang hoạt động tốt, cảm ơn bạn đã hỏi! Bạn có cần hỗ trợ gì không?"
   - "bye" → Sẽ nhận được: "Tạm biệt! Chúc bạn một ngày tốt lành!"
   - "thanks" → Sẽ nhận được: "Không có gì! Tôi rất vui được giúp đỡ bạn."

### 2. Test Dashboard

1. **Truy cập Dashboard**: `https://localhost:54410/dashboard`
2. **Kiểm tra bảng tin nhắn** - sẽ hiển thị tất cả tin nhắn đã gửi
3. **Click "Làm mới dữ liệu"** để refresh
4. **Click "Xem chi tiết"** để xem chi tiết tin nhắn

### 3. Test API Endpoints

1. **Test API Messages**: `https://localhost:5026/api/chat/messages`
2. **Test API History**: `https://localhost:5026/api/chat/history/{userId}`

### 4. Test SignalR Connection

1. **Mở Developer Tools** (F12)
2. **Vào tab Console**
3. **Kiểm tra log**:
   - "Đã kết nối SignalR thành công!"
   - "Chat bubble đã được thêm thành công!"

## 🔍 Kiểm tra Database

1. **Mở MySQL Workbench** hoặc phpMyAdmin
2. **Kết nối database**: `capstoneproject`
3. **Kiểm tra bảng**: `ChatMessages`
4. **Xem dữ liệu**:
   ```sql
   SELECT * FROM ChatMessages ORDER BY Timestamp DESC;
   ```

## 🐛 Troubleshooting

### Nếu chat không hoạt động:

1. **Kiểm tra console** (F12) xem có lỗi gì không
2. **Kiểm tra network tab** xem có request nào fail không
3. **Kiểm tra SignalR connection** trong console

### Nếu Dashboard không load được:

1. **Kiểm tra CORS** - đảm bảo server cho phép origin `https://localhost:54410`
2. **Kiểm tra API endpoint** có đúng port không
3. **Kiểm tra database connection**

### Nếu server không start:

1. **Kiểm tra port** có bị conflict không
2. **Kiểm tra MySQL** có đang chạy không
3. **Kiểm tra connection string** trong appsettings.json

## 📊 Flow hoạt động đã hoàn thành

1.  **User gửi tin nhắn** → Chat widget
2.  **SignalR** → Gửi tin nhắn đến server
3.  **Server** → Lưu tin nhắn vào MySQL
4.  **Mock ChatGPT** → Xử lý tin nhắn và trả response
5.  **Server** → Lưu response vào MySQL
6.  **SignalR** → Gửi response về chat widget
7.  **Dashboard** → Hiển thị lịch sử chat

## 🎯 Kết quả mong đợi

- Chat widget hiển thị và hoạt động
- Tin nhắn được gửi và nhận real-time
- Database lưu trữ tin nhắn user và ChatGPT
- Dashboard hiển thị lịch sử chat
- HTTPS hoạt động trên cả server và client
- SignalR connection ổn định

## 🚀 URLs quan trọng

- **Client**: `https://localhost:54410`
- **Dashboard**: `https://localhost:54410/dashboard`
- **Server API**: `https://localhost:5026`
- **SignalR Hub**: `https://localhost:5026/chatHub`

---

**🎉 Project đã hoàn thành và sẵn sàng test!**
