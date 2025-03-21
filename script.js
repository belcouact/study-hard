// DOM Elements
const apiStatus = document.getElementById('api-status');
const statusDot = document.querySelector('.status-dot');
const statusText = document.querySelector('.status-text');
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const startBtn = document.getElementById('start-btn');
const clearBtn = document.getElementById('clear-btn');

// API Configuration
const platformConfig = {
    'ark': {
        apiKey: '3654c0c8-acfd-469e-a1a4-eca3a9a95a5e',
        // Instead of using localhost, we'll use a Cloudflare Worker URL
        baseUrl: 'https://YOUR_CLOUDFLARE_WORKER_URL', // You'll need to replace this with your Worker URL
        model: 'bot-20250301110252-phnr8'
    }
};

// Current configuration
let currentConfig = platformConfig.ark;
let sessionActive = false;
let messageHistory = [];

// Initialize the app
window.addEventListener('DOMContentLoaded', async () => {
    await checkAPIConnection();
    
    // Event listeners
    startBtn.addEventListener('click', startSession);
    clearBtn.addEventListener('click', clearChat);
    sendBtn.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});

// Update API status UI
function updateAPIStatus(status, message) {
    statusDot.className = 'status-dot';
    statusDot.classList.add(status);
    statusText.textContent = `API Status: ${message}`;
}

// Check API connection
async function checkAPIConnection() {
    console.log('Checking API connection...');
    try {
        updateAPIStatus('working', '正在连接...');
        console.log('Sending test request to:', currentConfig.baseUrl);
        
        const response = await fetch(currentConfig.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentConfig.apiKey}`
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Hello' }]
            })
        });

        console.log('API response status:', response.status);

        if (response.ok) {
            console.log('API connection successful');
            updateAPIStatus('connected', '已连接');
            startBtn.disabled = false;
            return true;
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('API connection error:', error);
        updateAPIStatus('error', '连接失败，请确保您的 API 配置正确');
        startBtn.disabled = true;
        return false;
    }
}

// Start a new chat session
function startSession() {
    if (!sessionActive) {
        sessionActive = true;
        messageHistory = [];
        clearChat();
        userInput.disabled = false;
        sendBtn.disabled = false;
        startBtn.textContent = 'End Session';
        
        // Add system message to UI
        addMessageToChat('系统', '会话已开始。您可以开始提问了。', 'bot-message');
    } else {
        sessionActive = false;
        userInput.disabled = true;
        sendBtn.disabled = true;
        startBtn.textContent = 'Start Session';
        
        // Add system message to UI
        addMessageToChat('系统', '会话已结束。', 'bot-message');
    }
}

// Clear chat messages
function clearChat() {
    chatMessages.innerHTML = '';
}

// Send message to API
async function sendMessage() {
    const userMessage = userInput.value.trim();
    if (!userMessage || !sessionActive) return;
    
    // Add user message to UI
    addMessageToChat('用户', userMessage, 'user-message');
    userInput.value = '';
    
    // Add to message history
    messageHistory.push({ role: 'user', content: userMessage });
    
    // Show loading indicator
    const loadingMsgId = 'loading-' + Date.now();
    addMessageToChat('AI', '思考中...', 'bot-message', loadingMsgId);
    
    try {
        sendBtn.disabled = true;
        
        const response = await fetch(currentConfig.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentConfig.apiKey}`
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: '#角色名称：智慧教师' },
                    ...messageHistory
                ],
                temperature: 0.7,
                max_tokens: 2000
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            const botMessage = data.choices[0].message.content;
            
            // Remove loading message
            const loadingMsg = document.getElementById(loadingMsgId);
            if (loadingMsg) loadingMsg.remove();
            
            // Add bot response to UI
            addMessageToChat('AI', botMessage, 'bot-message');
            
            // Add to message history
            messageHistory.push({ role: 'assistant', content: botMessage });
        } else {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        
        // Remove loading message
        const loadingMsg = document.getElementById(loadingMsgId);
        if (loadingMsg) loadingMsg.remove();
        
        // Show error message
        addMessageToChat('系统', '发送消息时出错: ' + error.message, 'bot-message');
    } finally {
        sendBtn.disabled = false;
    }
}

// Add message to chat UI
function addMessageToChat(sender, content, className, messageId = null) {
    const message = document.createElement('div');
    message.className = `message ${className}`;
    if (messageId) message.id = messageId;
    
    const senderElement = document.createElement('div');
    senderElement.className = 'message-sender';
    senderElement.textContent = sender;
    
    const contentElement = document.createElement('div');
    contentElement.className = 'message-content';
    contentElement.textContent = content;
    
    message.appendChild(senderElement);
    message.appendChild(contentElement);
    
    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;
} 