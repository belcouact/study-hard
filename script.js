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
        baseUrl: 'https://ark-ds.5525899.workers.dev',
        botId: 'bot-20250301110252-phnr8'
    }
};

// Current configuration
let currentConfig = platformConfig.ark;
let sessionActive = false;
let messageHistory = [];

// Initialize the app
window.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing application...');
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

// Construct API URL
function getApiUrl() {
    // For the worker URL, we don't need the full path
    return currentConfig.baseUrl;
}

// Check API connection
async function checkAPIConnection() {
    console.log('Checking API connection...');
    try {
        updateAPIStatus('working', 'Connecting...');
        const apiUrl = getApiUrl();
        console.log('Sending test request to:', apiUrl);
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentConfig.apiKey}`,
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: 'Test connection' }],
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        console.log('API response status:', response.status);
        const responseText = await response.text();
        console.log('API response text:', responseText);

        if (response.ok) {
            console.log('API connection successful');
            updateAPIStatus('connected', 'Connected');
            startBtn.disabled = false;
            sendBtn.disabled = false;
            userInput.disabled = false;
            return true;
        } else {
            console.error('API Error Response:', responseText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('API connection error:', error);
        updateAPIStatus('error', 'Connection failed. Check console for details.');
        startBtn.disabled = true;
        sendBtn.disabled = true;
        userInput.disabled = true;
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
        addMessageToChat('System', 'Session started. You can start asking questions.', 'bot-message');
    } else {
        sessionActive = false;
        userInput.disabled = true;
        sendBtn.disabled = true;
        startBtn.textContent = 'Start Session';
        
        // Add system message to UI
        addMessageToChat('System', 'Session ended.', 'bot-message');
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
    addMessageToChat('User', userMessage, 'user-message');
    userInput.value = '';
    
    // Add to message history
    messageHistory.push({ role: 'user', content: userMessage });
    
    // Show loading indicator
    const loadingMsgId = 'loading-' + Date.now();
    addMessageToChat('AI', 'Thinking...', 'bot-message', loadingMsgId);
    
    try {
        sendBtn.disabled = true;
        const apiUrl = getApiUrl();
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentConfig.apiKey}`,
                'Accept': 'application/json'
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
        
        const responseText = await response.text();
        console.log('API Response:', responseText);
        
        if (response.ok) {
            let data;
            try {
                data = JSON.parse(responseText);
            } catch (e) {
                console.error('Error parsing API response:', e);
                throw new Error('Invalid JSON response from API');
            }
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Invalid response format from API');
            }
            
            const botMessage = data.choices[0].message.content;
            
            // Remove loading message
            const loadingMsg = document.getElementById(loadingMsgId);
            if (loadingMsg) loadingMsg.remove();
            
            // Add bot response to UI
            addMessageToChat('AI', botMessage, 'bot-message');
            
            // Add to message history
            messageHistory.push({ role: 'assistant', content: botMessage });
        } else {
            console.error('API Error Response:', responseText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
    } catch (error) {
        console.error('Error sending message:', error);
        
        // Remove loading message
        const loadingMsg = document.getElementById(loadingMsgId);
        if (loadingMsg) loadingMsg.remove();
        
        // Show error message
        addMessageToChat('System', 'Error sending message: ' + error.message, 'error-message');
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
