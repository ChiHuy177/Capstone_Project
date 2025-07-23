(function () {

    if (!document.querySelector('link[href*="font-awesome"]')) {
        const fontAwesomeLink = document.createElement('link');
        fontAwesomeLink.rel = 'stylesheet';
        fontAwesomeLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css';
        document.head.appendChild(fontAwesomeLink);
    }



    const css = `

         #chat-bubble.hidden {
            display: none;
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
            content: '';
            font-size: 16px;
            font-weight: bold;
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

    // Lấy các element
    const bubble = document.getElementById('chat-bubble');
    const chatWindow = document.getElementById('chat-window');
    const closeBtn = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('chat-send');
    const messagesContainer = document.getElementById('chat-messages');


    bubble.addEventListener('click', function () {
        if (chatWindow.style.display === 'flex') {
            chatWindow.style.display = 'none';
            bubble.classList.remove('hidden');
        } else {
            chatWindow.style.display = 'flex';
            bubble.classList.add('hidden');
        }
    });


    closeBtn.addEventListener('click', function () {
        chatWindow.style.display = 'none';
        bubble.classList.remove('hidden');
    });

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            // Thêm tin nhắn của user
            const userMsg = document.createElement('div');
            userMsg.className = 'message user-message';
            userMsg.textContent = message;
            messagesContainer.appendChild(userMsg);

            // Clear input
            chatInput.value = '';

            // Cuộn xuống cuối
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

            // Phản hồi tự động (có thể tùy chỉnh)
            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'message bot-message';
                botMsg.textContent = 'Cảm ơn bạn đã liên hệ! Tin nhắn của bạn đã được ghi nhận.';
                messagesContainer.appendChild(botMsg);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }, 1000);
        }
    }

    sendBtn.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    console.log('✅ Chat bubble đã được thêm thành công!');
})();