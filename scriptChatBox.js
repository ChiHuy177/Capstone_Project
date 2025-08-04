(function () {

    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fontAwesomeLink);
    }

    // Biến global cho connection
    let connection = null;
    let isConnected = false;
    let currentUser = 'Guest_' + Math.random().toString(36).substr(2, 9);
    let retryCount = 0;
    const MAX_RETRY = 3;
    let retryTimeout = null;

    // Hàm load SignalR library với Promise
    function loadSignalR() {
        return new Promise((resolve, reject) => {
            // Kiểm tra nếu đã có SignalR
            if (window.signalR) {
                resolve();
                return;
            }

            // Kiểm tra nếu đang load
            if (document.querySelector('script[src*="signalr"]')) {
                const checkSignalR = setInterval(() => {
                    if (window.signalR) {
                        clearInterval(checkSignalR);
                        resolve();
                    }
                }, 100);
                return;
            }

            // Load SignalR
            const signalRScript = document.createElement('script');
            signalRScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.1/signalr.min.js';
            
            signalRScript.onload = () => {
                // Đợi thêm một chút để đảm bảo SignalR đã sẵn sàng
                setTimeout(() => {
                    if (window.signalR) {
                        resolve();
                    } else {
                        reject(new Error('SignalR không load được'));
                    }
                }, 100);
            };
            
            signalRScript.onerror = () => {
                reject(new Error('Không thể load SignalR library'));
            };
            
            document.head.appendChild(signalRScript);
        });
    }

    const css = `

         #chat-bubble.hidden {
            display: none !important;
        }

        #chat-bubble {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background: #133F68;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
            animation: pulse 2s infinite;
        }
        
        #chat-bubble:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(0,0,0,0.4);
        }
        
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        #chat-bubble::before {
            content: '💬';
            font-size: 24px;
            color: white;
        }
        
        #chat-window {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            height: 400px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            z-index: 9998;
            display: none;
            flex-direction: column;
            overflow: hidden;
            font-family: Arial, sans-serif;
        }
        
        #chat-header {
            background: #133F68;
            color: white;
            padding: 15px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        #chat-close {
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            width: 25px;
            height: 25px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            transition: background 0.3s ease;
        }
        
        #chat-close:hover {
            background: rgba(255,255,255,0.3);
        }
        
        #chat-messages {
            flex: 1;
            padding: 15px;
            overflow-y: auto;
            background: #f8f9fa;
        }
        
        .message {
            margin-bottom: 10px;
            padding: 8px 12px;
            border-radius: 18px;
            max-width: 80%;
            word-wrap: break-word;
        }
        
        .user-message {
            background: #133F68;
            color: white;
            margin-left: auto;
            text-align: left;
            width: fit-content;
        }
        
        .bot-message {
            background: #e9ecef;
            color: #333;
            margin-right: auto;
            text-align: left;
            width: fit-content;
        }

        .system-message {
            background: #fff3cd;
            color: #856404;
            text-align: center;
            font-style: italic;
            font-size: 12px;
            margin: 5px 0;
            padding: 5px 10px;
            border-radius: 10px;
        }
        
        #chat-input-container {
            padding: 15px;
            border-top: 1px solid #e9ecef;
            display: flex;
            gap: 10px;
        }
        
        #chat-input {
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 20px;
            outline: none;
            font-size: 14px;
        }
        
        #chat-send {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: transform 0.2s ease;
        }
        
        #chat-send:hover {
            transform: scale(1.1);
        }
        
        #chat-send::before {
            font-family: "Font Awesome 6 Free";
            content: '';
            font-size: 16px;
            font-weight: bold;
        }

        #chat-loading {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 10px;
        }
    `;

    // Tạo HTML
    const html = `
        <div id="chat-bubble"></div>
        <div id="chat-window">
            <div id="chat-header">
                <span>Chat Hỗ Trợ</span>
                <div id="chat-close">×</div>
            </div>
            <div id="chat-messages">
                <div class="message bot-message">Xin chào! Tôi có thể giúp gì cho bạn?</div>
            </div>
            <div id="chat-input-container">
                <input type="text" id="chat-input" placeholder="Nhập tin nhắn..." />
                <button id="chat-send"></button>
            </div>
        </div>
    `;

    // Thêm CSS vào trang
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    // Thêm HTML vào trang
    const chatContainer = document.createElement('div');
    chatContainer.innerHTML = html;
    document.body.appendChild(chatContainer);

    // Hàm kiểm tra và lấy DOM elements
    function getChatElements() {
        const elements = {
            bubble: document.getElementById('chat-bubble'),
            chatWindow: document.getElementById('chat-window'),
            closeBtn: document.getElementById('chat-close'),
            chatInput: document.getElementById('chat-input'),
            sendBtn: document.getElementById('chat-send'),
            messagesContainer: document.getElementById('chat-messages')
        };

        // Kiểm tra xem tất cả elements có tồn tại không
        for (const [key, element] of Object.entries(elements)) {
            if (!element) {
                console.error(`❌ Không tìm thấy element: ${key}`);
                return null;
            }
        }

        return elements;
    }

    // Hàm khởi tạo SignalR
    async function initializeSignalR() {
        try {
            // Đợi SignalR library load xong
            await loadSignalR();

            // Kiểm tra SignalR object
            if (!window.signalR) {
                throw new Error('SignalR object không tồn tại');
            }

            // Sử dụng HTTPS URL với port đúng
            const baseUrl = window.location.protocol === 'https:' 
                ? 'https://localhost:5026' 
                : 'http://localhost:5026';
            
            connection = new signalR.HubConnectionBuilder()
                .withUrl(`${baseUrl}/chatHub`, {
                    skipNegotiation: true,
                    transport: signalR.HttpTransportType.WebSockets
                })
                .withAutomaticReconnect()
                .build();

            // Lắng nghe tin nhắn từ server
            connection.on("ReceiveMessage", (user, message) => {
                addBotMessage(message, user);
            });

            // Lắng nghe khi user join
            connection.on("UserJoined", (user) => {
                addSystemMessage(`${user} đã tham gia chat`);
            });

            // Lắng nghe khi mất kết nối
            connection.onclose(() => {
                isConnected = false;
                addSystemMessage("❌ Mất kết nối. Đang thử kết nối lại...");
                
                // Tự động reconnect sau 5 giây
                if (retryTimeout) {
                    clearTimeout(retryTimeout);
                }
                
                retryTimeout = setTimeout(() => {
                    if (!isConnected && retryCount < MAX_RETRY) {
                        retryCount++;
                        initializeSignalR();
                    } else if (retryCount >= MAX_RETRY) {
                        addSystemMessage("❌ Đã thử kết nối lại nhiều lần. Vui lòng refresh trang.");
                    }
                }, 5000);
            });

            // Kết nối
            await connection.start();
            isConnected = true;
            retryCount = 0; // Reset retry count khi kết nối thành công
            
            // Thông báo join
            await connection.invoke("JoinChat", currentUser);
            
            console.log("✅ Đã kết nối SignalR thành công!");
            addSystemMessage("✅ Đã kết nối thành công!");
        } catch (err) {
            console.error("❌ Lỗi kết nối SignalR:", err);
            addSystemMessage("❌ Không thể kết nối đến server. Vui lòng thử lại sau.");
            
            // Retry logic
            if (retryCount < MAX_RETRY) {
                retryCount++;
                setTimeout(() => {
                    initializeSignalR();
                }, 3000);
            }
        }
    }

    // Hàm hiển thị loading
    function showLoading() {
        const elements = getChatElements();
        if (!elements) return;
        
        const loading = document.createElement('div');
        loading.id = 'chat-loading';
        loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang kết nối...';
        elements.messagesContainer.appendChild(loading);
    }

    // Hàm ẩn loading
    function hideLoading() {
        const loading = document.getElementById('chat-loading');
        if (loading) loading.remove();
    }

    // Hàm thêm tin nhắn user
    function addUserMessage(message) {
        const elements = getChatElements();
        if (!elements) return;
        
        const userMsg = document.createElement('div');
        userMsg.className = 'message user-message';
        userMsg.textContent = message;
        elements.messagesContainer.appendChild(userMsg);
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }

    // Hàm thêm tin nhắn bot
    function addBotMessage(message, user = 'Bot') {
        const elements = getChatElements();
        if (!elements) return;
        
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot-message';
        botMsg.innerHTML = `<strong>${user}:</strong> ${message}`;
        elements.messagesContainer.appendChild(botMsg);
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }

    // Hàm thêm tin nhắn hệ thống
    function addSystemMessage(message) {
        const elements = getChatElements();
        if (!elements) return;
        
        const sysMsg = document.createElement('div');
        sysMsg.className = 'message system-message';
        sysMsg.textContent = message;
        elements.messagesContainer.appendChild(sysMsg);
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }

    // Hàm setup event listeners
    function setupEventListeners() {
        const elements = getChatElements();
        if (!elements) return;

        elements.bubble.addEventListener('click', function () {
            if (elements.chatWindow.style.display === 'flex') {
                elements.chatWindow.style.display = 'none';
                elements.bubble.classList.remove('hidden');
            } else {
                elements.chatWindow.style.display = 'flex';
                elements.bubble.classList.add('hidden');
            }
        });

        elements.closeBtn.addEventListener('click', function () {
            elements.chatWindow.style.display = 'none';
            elements.bubble.classList.remove('hidden');
        });

        elements.sendBtn.addEventListener('click', sendMessage);

        elements.chatInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    }

    // Hàm gửi tin nhắn
    async function sendMessage() {
        const elements = getChatElements();
        if (!elements) return;
        
        const message = elements.chatInput.value.trim();
        if (message) {
            // Thêm tin nhắn của user
            addUserMessage(message);

            // Clear input
            elements.chatInput.value = '';

            // Gửi tin nhắn qua SignalR
            if (isConnected && connection) {
                try {
                    await connection.invoke("SendMessage", currentUser, message);
                } catch (err) {
                    console.error("❌ Lỗi gửi tin nhắn:", err);
                    addSystemMessage("❌ Lỗi gửi tin nhắn. Vui lòng thử lại!");
                }
            } else {
                // Fallback nếu không kết nối được
                addBotMessage("Đang kết nối... Vui lòng thử lại sau.");
            }
        }
    }

    // Hàm cleanup
    function cleanup() {
        if (retryTimeout) {
            clearTimeout(retryTimeout);
        }
        if (connection) {
            connection.stop();
        }
    }

    // Khởi tạo khi trang load xong
    async function initialize() {
        try {
            // Setup event listeners trước
            setupEventListeners();
            
            // Khởi tạo SignalR
            await initializeSignalR();
            
            console.log('✅ Chat bubble đã được thêm thành công!');
        } catch (err) {
            console.error('❌ Lỗi khởi tạo chat bubble:', err);
        }
    }

    // Khởi tạo khi trang load xong
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }

    // Cleanup khi trang unload
    window.addEventListener('beforeunload', cleanup);

})();
