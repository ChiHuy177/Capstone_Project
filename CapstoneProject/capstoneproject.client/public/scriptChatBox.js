(function () {
    // Kiểm tra nếu script đã được load
    if (window.chatBoxInitialized) {
        console.log('⚠️ Chat box đã được khởi tạo trước đó, bỏ qua...');
        return;
    }
    window.chatBoxInitialized = true;

    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href =
            'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fontAwesomeLink);
    }

    // Biến global cho connection
    let connection = null;
    let isConnected = false;
    let currentUser = 'Guest_' + Math.random().toString(36).substr(2, 9);
    let userInfo = null; // Thêm biến lưu thông tin người dùng
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
            signalRScript.src =
                'https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/6.0.1/signalr.min.js';

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
            background: #133F68;
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
            content: '➤';
            font-size: 18px;
        }

        #chat-loading {
            text-align: center;
            color: #666;
            font-style: italic;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 18px;
            margin: 10px 0;
            border: 1px solid #e9ecef;
            animation: pulse 1.5s infinite;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .loading-spinner {
            width: 16px;
            height: 16px;
            border: 2px solid #133F68;
            border-top: 2px solid transparent;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }

        .typing-indicator {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 8px 12px;
            background: #e9ecef;
            border-radius: 18px;
            width: fit-content;
            margin: 10px 0;
            margin-right: auto;
            text-align: left;
            position: relative;
            max-width: 80%;
            word-wrap: break-word;
        }

        .typing-dot {
            width: 8px;
            height: 8px;
            background: #666;
            border-radius: 50%;
            animation: typing 1.4s infinite ease-in-out;
        }

        .typing-dot:nth-child(1) { animation-delay: -0.32s; }
        .typing-dot:nth-child(2) { animation-delay: -0.16s; }
        .typing-dot:nth-child(3) { animation-delay: 0s; }

        @keyframes typing {
            0%, 80%, 100% {
                transform: scale(0.8);
                opacity: 0.5;
            }
            40% {
                transform: scale(1);
                opacity: 1;
            }
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* CSS cho form nhập thông tin trong chat window */
        #user-info-form {
            flex: 1;
            padding: 20px;
            display: flex;
            flex-direction: column;
            background: #f8f9fa;
        }

        #user-info-form h3 {
            margin: 0 0 20px 0;
            color: #133F68;
            text-align: center;
            font-size: 16px;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #333;
            font-weight: bold;
            font-size: 13px;
        }

        .form-group input {
            width: 100%;
            padding: 10px;
            border: 2px solid #ddd;
            border-radius: 8px;
            font-size: 13px;
            box-sizing: border-box;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus {
            outline: none;
            border-color: #133F68;
        }

        .form-group input.error {
            border-color: #dc3545;
        }

        .error-message {
            color: #dc3545;
            font-size: 11px;
            margin-top: 3px;
            display: none;
        }

        #start-chat-btn {
            width: 100%;
            padding: 12px;
            background: #133F68;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s ease;
            margin-top: 10px;
        }

        #start-chat-btn:hover {
            background: #0d2d4a;
        }

        #start-chat-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        /* Ẩn chat messages và input khi hiển thị form */
        #chat-window.showing-form #chat-messages,
        #chat-window.showing-form #chat-input-container {
            display: none;
        }

        #chat-window.showing-form #user-info-form {
            display: flex;
        }

        #chat-window:not(.showing-form) #user-info-form {
            display: none;
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
            
            <!-- Form nhập thông tin người dùng -->
            <div id="user-info-form">
                <h3>Thông tin liên hệ</h3>
                <div class="form-group">
                    <label for="user-name">Họ và tên *</label>
                    <input type="text" id="user-name" placeholder="Nhập họ và tên của bạn" />
                    <div class="error-message" id="name-error">Vui lòng nhập họ và tên</div>
                </div>
                <div class="form-group">
                    <label for="user-phone">Số điện thoại *</label>
                    <input type="tel" id="user-phone" placeholder="Nhập số điện thoại" />
                    <div class="error-message" id="phone-error">Vui lòng nhập số điện thoại hợp lệ</div>
                </div>
                <button id="start-chat-btn">Bắt đầu chat</button>
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
            messagesContainer: document.getElementById('chat-messages'),
            form: document.getElementById('user-info-form'),
            nameInput: document.getElementById('user-name'),
            phoneInput: document.getElementById('user-phone'),
            startBtn: document.getElementById('start-chat-btn'),
            nameError: document.getElementById('name-error'),
            phoneError: document.getElementById('phone-error'),
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

    // Hàm hiển thị form nhập thông tin
    function showUserInfoForm() {
        const elements = getChatElements();
        if (!elements) return;

        // Hiển thị chat window và thêm class để hiển thị form
        elements.chatWindow.style.display = 'flex';
        elements.chatWindow.classList.add('showing-form');
        elements.bubble.classList.add('hidden');
        elements.nameInput.focus();
    }

    // Hàm ẩn form nhập thông tin
    function hideUserInfoForm() {
        const elements = getChatElements();
        if (!elements) return;

        // Xóa class để hiển thị lại chat messages và input
        elements.chatWindow.classList.remove('showing-form');
    }

    // Hàm validate form
    function validateForm() {
        const elements = getChatElements();
        if (!elements) return false;

        let isValid = true;

        // Validate tên
        const name = elements.nameInput.value.trim();
        if (!name) {
            elements.nameInput.classList.add('error');
            elements.nameError.style.display = 'block';
            isValid = false;
        } else {
            elements.nameInput.classList.remove('error');
            elements.nameError.style.display = 'none';
        }

        // Validate số điện thoại
        const phone = elements.phoneInput.value.trim();
        const phoneRegex = /^[0-9]{10,11}$/;
        if (!phone || !phoneRegex.test(phone)) {
            elements.phoneInput.classList.add('error');
            elements.phoneError.style.display = 'block';
            isValid = false;
        } else {
            elements.phoneInput.classList.remove('error');
            elements.phoneError.style.display = 'none';
        }

        return isValid;
    }

    // Hàm xử lý khi bấm bắt đầu chat
    async function handleStartChat() {
        if (!validateForm()) {
            return;
        }

        const elements = getChatElements();
        if (!elements) return;

        // Lưu thông tin người dùng
        userInfo = {
            name: elements.nameInput.value.trim(),
            phone: elements.phoneInput.value.trim(),
        };

        // Cập nhật currentUser với tên thật
        currentUser = userInfo.name;

        // Ẩn form và hiển thị chat
        hideUserInfoForm();

        // Thêm tin nhắn chào mừng
        addBotMessage(`Xin chào ${userInfo.name}! Tôi có thể giúp gì cho bạn?`);

        // Kết nối SignalR
        await initializeSignalR();
    }

    // Hàm format tin nhắn từ server
    function formatMessage(message) {
        if (!message) return '';

        // Chuyển \n thành <br>
        let formatted = message.replace(/\n/g, '<br>');

        // Chuyển **text** thành <strong>text</strong>
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // Chuyển * ở đầu dòng thành bullet points
        formatted = formatted.replace(/^\* (.*?)$/gm, '<li>$1</li>');

        // Nếu có <li> thì wrap trong <ul>
        if (formatted.includes('<li>')) {
            formatted = formatted.replace(
                /(<li>.*?<\/li>)/gs,
                '<ul style="margin: 10px 0; padding-left: 20px;">$1</ul>'
            );
        }

        return formatted;
    }

    // Hàm thêm tin nhắn bot
    function addBotMessage(message, user = 'Bot') {
        const elements = getChatElements();
        if (!elements) return;

        console.log('🤖 Thêm tin nhắn bot:', message, 'từ user:', user);
        const botMsg = document.createElement('div');
        botMsg.className = 'message bot-message';

        // Format tin nhắn trước khi hiển thị
        const formattedMessage = formatMessage(message);
        botMsg.innerHTML = `<strong>${user}:</strong> ${formattedMessage}`;

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

    // Hàm hiển thị typing indicator
    function showTypingIndicator() {
        const elements = getChatElements();
        if (!elements) return;

        // Ẩn typing indicator cũ nếu có
        hideTypingIndicator();

        const typingIndicator = document.createElement('div');
        typingIndicator.id = 'typing-indicator';
        typingIndicator.className = 'typing-indicator';
        typingIndicator.innerHTML = `
            <span style="font-size: 12px; color: #666; margin-right: 8px;">Bot đang nhập...</span>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;

        // Append vào cuối messages container
        elements.messagesContainer.appendChild(typingIndicator);

        // Scroll xuống cuối để hiển thị typing indicator
        setTimeout(() => {
            elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
        }, 100);

        console.log('💬 Typing indicator đã được hiển thị');

        // Lưu thời gian bắt đầu hiển thị
        typingIndicator.dataset.startTime = Date.now();
    }

    // Hàm ẩn typing indicator với delay tối thiểu
    function hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            const startTime = parseInt(typingIndicator.dataset.startTime) || 0;
            const elapsed = Date.now() - startTime;
            const minDisplayTime = 1500; // Tối thiểu 1.5 giây

            if (elapsed < minDisplayTime) {
                // Nếu chưa đủ thời gian, đợi thêm
                setTimeout(() => {
                    const indicator = document.getElementById('typing-indicator');
                    if (indicator) {
                        indicator.remove();
                        console.log('✅ Typing indicator đã được ẩn sau delay');
                    }
                }, minDisplayTime - elapsed);
            } else {
                // Nếu đã đủ thời gian, ẩn ngay
                typingIndicator.remove();
                console.log('✅ Typing indicator đã được ẩn');
            }
        }
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
            const baseUrl =
                window.location.protocol === 'https:'
                    ? 'https://localhost:5026'
                    : 'http://localhost:5026';

            connection = new signalR.HubConnectionBuilder()
                .withUrl(`${baseUrl}/chatHub`, {
                    skipNegotiation: true,
                    transport: signalR.HttpTransportType.WebSockets,
                })
                .withAutomaticReconnect()
                .build();

            // Lắng nghe tin nhắn từ server
            connection.on('ReceiveMessage', (user, message) => {
                console.log('📨 Nhận tin nhắn từ server:', { user, message });
                // Ẩn typing indicator trước khi hiển thị tin nhắn
                hideTypingIndicator();
                addBotMessage(message, user);
            });

            // Lắng nghe khi user join
            connection.on('UserJoined', (user) => {
                addSystemMessage(`${user} đã tham gia chat`);
            });

            // Lắng nghe khi mất kết nối
            connection.onclose(() => {
                isConnected = false;
                addSystemMessage('❌ Mất kết nối. Đang thử kết nối lại...');

                // Tự động reconnect sau 5 giây
                if (retryTimeout) {
                    clearTimeout(retryTimeout);
                }

                retryTimeout = setTimeout(() => {
                    if (!isConnected && retryCount < MAX_RETRY) {
                        retryCount++;
                        initializeSignalR();
                    } else if (retryCount >= MAX_RETRY) {
                        addSystemMessage(
                            '❌ Đã thử kết nối lại nhiều lần. Vui lòng refresh trang.'
                        );
                    }
                }, 5000);
            });

            // Kết nối
            await connection.start();
            isConnected = true;
            retryCount = 0; // Reset retry count khi kết nối thành công

            // Thông báo join với thông tin người dùng
            await connection.invoke('JoinChat', currentUser);

            console.log('✅ Đã kết nối SignalR thành công!');
            addSystemMessage('✅ Đã kết nối thành công!');
        } catch (err) {
            console.error('❌ Lỗi kết nối SignalR:', err);
            addSystemMessage('❌ Không thể kết nối đến server. Vui lòng thử lại sau.');

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

        // Ẩn loading cũ nếu có
        hideLoading();

        const loading = document.createElement('div');
        loading.id = 'chat-loading';
        loading.innerHTML = '<div class="loading-spinner"></div> Đang xử lý tin nhắn...';
        elements.messagesContainer.appendChild(loading);
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;

        // Log để debug
        console.log('🔄 Loading indicator đã được hiển thị');
    }

    // Hàm ẩn loading
    function hideLoading() {
        const loading = document.getElementById('chat-loading');
        if (loading) {
            loading.remove();
            console.log('✅ Loading indicator đã được ẩn');
        } else {
            console.log('⚠️ Không tìm thấy loading indicator để ẩn');
        }
    }

    // Hàm thêm tin nhắn user
    function addUserMessage(message) {
        const elements = getChatElements();
        if (!elements) return;

        console.log('👤 Thêm tin nhắn user:', message);
        const userMsg = document.createElement('div');
        userMsg.className = 'message user-message';
        userMsg.textContent = message;
        elements.messagesContainer.appendChild(userMsg);
        elements.messagesContainer.scrollTop = elements.messagesContainer.scrollHeight;
    }

    // Hàm setup event listeners
    function setupEventListeners() {
        const elements = getChatElements();
        if (!elements) return;

        // Event cho chat bubble - hiển thị form thông tin
        elements.bubble.addEventListener('click', function () {
            showUserInfoForm();
        });

        // Event cho nút bắt đầu chat
        elements.startBtn.addEventListener('click', handleStartChat);

        // Event cho form inputs - validate realtime
        elements.nameInput.addEventListener('input', function () {
            if (this.value.trim()) {
                this.classList.remove('error');
                elements.nameError.style.display = 'none';
            }
        });

        elements.phoneInput.addEventListener('input', function () {
            const phoneRegex = /^[0-9]{10,11}$/;
            if (this.value.trim() && phoneRegex.test(this.value.trim())) {
                this.classList.remove('error');
                elements.phoneError.style.display = 'none';
            }
        });

        // Event cho Enter key trong form
        elements.nameInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                elements.phoneInput.focus();
            }
        });

        elements.phoneInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                handleStartChat();
            }
        });

        // Event cho chat window
        elements.closeBtn.addEventListener('click', function () {
            elements.chatWindow.style.display = 'none';
            elements.bubble.classList.remove('hidden');
            // Reset form khi đóng chat window
            hideUserInfoForm();
            elements.nameInput.value = '';
            elements.phoneInput.value = '';
            elements.nameInput.classList.remove('error');
            elements.phoneInput.classList.remove('error');
            elements.nameError.style.display = 'none';
            elements.phoneError.style.display = 'none';
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
            console.log('📤 Gửi tin nhắn:', message);

            // Clear input trước
            elements.chatInput.value = '';

            // Hiển thị tin nhắn user ngay lập tức
            addUserMessage(message);

            // Hiển thị typing indicator
            showTypingIndicator();

            // Gửi tin nhắn qua SignalR
            if (isConnected && connection) {
                try {
                    // Gửi tin nhắn (không cần await vì response sẽ đến qua SignalR event)
                    await connection.invoke('SendMessage', currentUser, message);

                    // Set timeout để ẩn typing indicator nếu không nhận được response
                    setTimeout(() => {
                        const typingIndicator = document.getElementById('typing-indicator');
                        if (typingIndicator) {
                            hideTypingIndicator();
                            addSystemMessage('⏰ Không nhận được phản hồi. Vui lòng thử lại!');
                        }
                    }, 30000); // 30 giây timeout
                } catch (err) {
                    console.error('❌ Lỗi gửi tin nhắn:', err);
                    hideTypingIndicator();
                    addSystemMessage('❌ Lỗi gửi tin nhắn. Vui lòng thử lại!');
                }
            } else {
                // Fallback nếu không kết nối được
                hideTypingIndicator();
                addSystemMessage('❌ Không có kết nối. Vui lòng thử lại sau.');
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
