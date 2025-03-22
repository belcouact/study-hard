// Environment variables from config.js
const DS_URL = window._env.ds_url;
const DS_KEY = window._env.ds_key;
const IMG_URL = "https://txt-2-img.5525899.workers.dev";

if (!DS_URL || !DS_KEY) {
    console.error('Environment variables not properly configured. Please check config.js');
}

// Text Generation Functions
async function handleChatOutput(prompt) {
    try {
        // Validate input
        if (!prompt || prompt.trim() === '') {
            throw new Error('Please enter a valid prompt');
        }

        // Log the request details
        console.log('Sending request with prompt:', prompt.trim());
        console.log('Request URL:', DS_URL);

        const response = await fetch(DS_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${DS_KEY}`
            },
            body: JSON.stringify({
                messages: [{
                    role: "user",
                    content: prompt.trim()
                }],
                model: "deepseek-chat",
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        // Log the response status
        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        
        // Log the raw response
        console.log('Raw API response:', result);
        
        // Format the response for better display
        if (result.choices && result.choices[0]?.message?.content) {
            return result.choices[0].message.content;
        }
        return JSON.stringify(result, null, 2);
    } catch (error) {
        console.error('Worker call error:', error);
        throw error;
    }
}

// Modal Functions
function showModal(title, content) {
    const modal = document.getElementById('popupModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    modalTitle.textContent = title;
    modalContent.innerHTML = content;
    modal.style.display = 'block';

    // Close modal when clicking outside
    modal.onclick = function(event) {
        if (event.target === modal) {
            closeModal();
        }
    };
}

function closeModal() {
    const modal = document.getElementById('popupModal');
    modal.style.display = 'none';
}

// Update handleSubmit function
async function handleSubmit() {
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const promptInput = document.getElementById('promptInput');

    // Reset UI
    error.style.display = 'none';
    
    // Disable button and show loading
    submitBtn.disabled = true;
    loading.style.display = 'block';

    try {
        const result = await handleChatOutput(promptInput.value);
        showModal('Text Generation Result', result.replace(/\n/g, '<br>'));
    } catch (err) {
        error.textContent = `Error: ${err.message}`;
        error.style.display = 'block';
    } finally {
        // Re-enable button and hide loading
        submitBtn.disabled = false;
        loading.style.display = 'none';
    }
}

// Update handleImageGeneration function
async function handleImageGeneration() {
    const generateImageBtn = document.getElementById('generateImageBtn');
    const imageLoading = document.getElementById('imageLoading');
    const imageError = document.getElementById('imageError');
    const imagePromptInput = document.getElementById('imagePromptInput');

    // Reset UI
    imageError.style.display = 'none';
    
    // Validate input
    if (!imagePromptInput.value.trim()) {
        imageError.textContent = 'Please enter a description for the image';
        imageError.style.display = 'block';
        return;
    }

    // Disable button and show loading
    generateImageBtn.disabled = true;
    imageLoading.style.display = 'block';

    try {
        const response = await fetch(IMG_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: imagePromptInput.value.trim()
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! Status: ${response.status}`);
        }

        // Get the image as a blob
        const blob = await response.blob();
        
        // Create an object URL from the blob
        const imageUrl = URL.createObjectURL(blob);
        
        // Show the image in modal
        showModal('Generated Image', `<img src="${imageUrl}" alt="Generated image">`);
        
        // Clean up the object URL when the modal is closed
        const modal = document.getElementById('popupModal');
        const cleanup = () => {
            URL.revokeObjectURL(imageUrl);
            modal.removeEventListener('click', cleanup);
        };
        modal.addEventListener('click', cleanup);
    } catch (err) {
        imageError.textContent = `Error: ${err.message}`;
        imageError.style.display = 'block';
    } finally {
        // Re-enable button and hide loading
        generateImageBtn.disabled = false;
        imageLoading.style.display = 'none';
    }
}

// SVG Generation Functions
async function handleSvgGeneration() {
    const createSvgBtn = document.getElementById('createSvgBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const promptInput = document.getElementById('promptInput');

    // Reset UI
    error.style.display = 'none';
    
    // Disable button and show loading
    createSvgBtn.disabled = true;
    loading.style.display = 'block';

    try {
        // Step 1: Get SVG design suggestion in Chinese
        const designPrompt = `基于以下内容："${promptInput.value}"，请提供一个详细的SVG设计建议。要求：
        1. 整体布局和构图设计
        2. 主要视觉元素及其排列方式
        3. 配色方案和风格建议
        4. 建议使用的SVG特效（渐变、滤镜、动画等）
        5. 如何突出主题和重点
        6. 如何确保设计感强且美观
        请用中文详细说明，并确保设计建议具有创意性和实用性。`;

        const designSuggestion = await handleChatOutput(designPrompt);
        
        // Step 2: Generate SVG code with improved design
        const svgPrompt = `根据以下设计建议创建SVG代码："${designSuggestion}"
        要求：
        1. 使用标准的SVG语法和最佳实践
        2. 包含所有必要的属性和样式
        3. 确保响应式设计和可扩展性
        4. 优化性能
        5. 添加适当的背景和装饰元素
        6. 使用渐变色和滤镜增强视觉效果
        7. 确保整体设计明亮、现代且富有设计感
        8. 添加适当的阴影和光效
        9. 确保所有文字清晰可读
        10. 添加适当的动画效果
        请直接返回SVG代码，不要包含任何解释。`;

        const svgCode = await handleChatOutput(svgPrompt);
        
        // Step 3: Create and display the SVG with Chinese labels
        const svgContent = `
            <div class="svg-container">
                <div class="svg-controls">
                    <button class="control-btn" onclick="printSvg()">打印</button>
                    <button class="control-btn" onclick="downloadSvg()">下载</button>
                </div>
                <div class="design-suggestion">
                    <h3>设计建议：</h3>
                    <pre>${designSuggestion}</pre>
                </div>
                <div class="svg-content">
                    ${svgCode}
                </div>
            </div>
        `;

        // Show the SVG in the modal with Chinese title
        showModal('生成的SVG设计', svgContent);
    } catch (err) {
        error.textContent = `错误：${err.message}`;
        error.style.display = 'block';
    } finally {
        // Re-enable button and hide loading
        createSvgBtn.disabled = false;
        loading.style.display = 'none';
    }
}

// SVG Utility Functions
function printSvg() {
    const printWindow = window.open('', '_blank');
    const svgContent = document.querySelector('.svg-content').innerHTML;
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>打印SVG</title>
            <style>
                body {
                    margin: 0;
                    padding: 20px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    background-color: #ffffff;
                }
                .svg-container {
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                svg {
                    max-width: 100%;
                    height: auto;
                }
            </style>
        </head>
        <body>
            <div class="svg-container">
                ${svgContent}
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.onload = function() {
        printWindow.print();
    };
}

function downloadSvg() {
    const svgContent = document.querySelector('.svg-content').innerHTML;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Add message port error handling
    window.addEventListener('error', function(event) {
        if (event.message.includes('message port closed')) {
            console.warn('Message port closed - this is usually not a critical error');
        }
    });

    // Allow Enter key to submit (Shift+Enter for new line)
    const promptInput = document.getElementById('promptInput');
    const imagePromptInput = document.getElementById('imagePromptInput');

    promptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (e.ctrlKey) {
                handleSvgGeneration();
            } else {
                handleSubmit();
            }
        }
    });

    imagePromptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleImageGeneration();
        }
    });
});
