# Capstone Project - Chat System

## Mô tả Project

Đây là một hệ thống chat hoàn chỉnh với các tính năng:

- Chat widget tích hợp với SignalR real-time
- Lưu trữ tin nhắn vào MySQL database
- Mock ChatGPT responses
- Dashboard để quản lý tin nhắn
- HTTPS support

## Cấu trúc Project

```
CapstoneProject/
├── CapstoneProject.Server/     # ASP.NET Core API + SignalR
├── capstoneproject.client/     # React Frontend
└── scriptChatBox.js           # Chat Widget
```

## Yêu cầu hệ thống

- .NET 9.0
- Node.js 18+
- MySQL 8.0+
- Visual Studio 2022 hoặc VS Code

## Cài đặt và Chạy Project

### 1. Cấu hình Database

1. Cài đặt MySQL Server
2. Tạo database:

```sql
CREATE DATABASE capstoneproject;
```

3. Cập nhật connection string trong `CapstoneProject.Server/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=capstoneproject;User=root;Password=your_password;Port=3306;"
  }
}
```

### 2. Chạy Server

```bash
cd CapstoneProject/CapstoneProject.Server
dotnet restore
dotnet ef database update
dotnet run
```

Server sẽ chạy tại: `https://localhost:7001`

### 3. Chạy Client

```bash
cd CapstoneProject/capstoneproject.client
npm install
npm run dev
```

Client sẽ chạy tại: `https://localhost:54410`

### 4. Kiểm tra hoạt động

1. Mở browser và truy cập: `https://localhost:54410`
2. Bạn sẽ thấy chat bubble ở góc phải dưới
3. Click vào chat bubble để mở chat window
4. Gửi tin nhắn để test
5. Truy cập Dashboard tại: `https://localhost:54410/dashboard`

## Flow hoạt động

1. **User gửi tin nhắn** → Chat widget
2. **SignalR** → Gửi tin nhắn đến server
3. **Server** → Lưu tin nhắn vào MySQL
4. **Mock ChatGPT** → Xử lý tin nhắn và trả response
5. **Server** → Lưu response vào MySQL
6. **SignalR** → Gửi response về chat widget
7. **Dashboard** → Hiển thị lịch sử chat

## API Endpoints

- `GET /api/chat/messages` - Lấy tất cả tin nhắn
- `GET /api/chat/history/{userId}` - Lấy lịch sử chat của user
- `POST /chatHub` - SignalR Hub cho real-time chat

## Troubleshooting

### Lỗi kết nối SignalR

- Kiểm tra HTTPS certificate
- Đảm bảo CORS được cấu hình đúng
- Kiểm tra firewall

### Lỗi Database

- Kiểm tra MySQL service đang chạy
- Kiểm tra connection string
- Chạy `dotnet ef database update`

### Lỗi Build

- Chạy `dotnet restore`
- Xóa thư mục `bin` và `obj`, sau đó build lại

## Cấu hình HTTPS

Project đã được cấu hình để chạy trên HTTPS:

- Server: `https://localhost:7001`
- Client: `https://localhost:54410`

Nếu gặp lỗi certificate, chạy:

```bash
dotnet dev-certs https --trust
```

## Tính năng

- Real-time chat với SignalR
- Lưu trữ MySQL
- Mock ChatGPT responses
- Dashboard quản lý
- HTTPS support
- Auto-reconnection
- Responsive design
- Vietnamese language support
