// Environment variables from config.js
const DS_URL = window._env.ds_url;
const DS_KEY = window._env.ds_key;
const IMG_URL = "https://txt-2-img.5525899.workers.dev";

if (!DS_URL || !DS_KEY) {
    console.error('Environment variables not properly configured. Please check config.js');
}

// Text Generation Functions
async function callWorker(prompt) {
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

async function handleSubmit() {
    const submitBtn = document.getElementById('submitBtn');
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const responseContent = document.getElementById('responseContent');
    const promptInput = document.getElementById('promptInput');

    // Reset UI
    error.style.display = 'none';
    responseContent.textContent = '';
    
    // Disable button and show loading
    submitBtn.disabled = true;
    loading.style.display = 'block';

    try {
        const result = await callWorker(promptInput.value);
        responseContent.innerHTML = result.replace(/\n/g, '<br>');
    } catch (err) {
        error.textContent = `Error: ${err.message}`;
        error.style.display = 'block';
    } finally {
        // Re-enable button and hide loading
        submitBtn.disabled = false;
        loading.style.display = 'none';
    }
}

// Image Generation Functions
async function handleImageGeneration() {
    const generateImageBtn = document.getElementById('generateImageBtn');
    const imageLoading = document.getElementById('imageLoading');
    const imageError = document.getElementById('imageError');
    const imageResult = document.getElementById('imageResult');
    const imagePromptInput = document.getElementById('imagePromptInput');

    // Reset UI
    imageError.style.display = 'none';
    imageResult.innerHTML = '';
    
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
        
        // Display the image
        imageResult.innerHTML = `<img src="${imageUrl}" alt="Generated image" style="max-width: 100%; height: auto;">`;
        
        // Clean up the object URL when the image is loaded
        const img = imageResult.querySelector('img');
        img.onload = () => {
            URL.revokeObjectURL(imageUrl);
        };
    } catch (err) {
        imageError.textContent = `Error: ${err.message}`;
        imageError.style.display = 'block';
    } finally {
        // Re-enable button and hide loading
        generateImageBtn.disabled = false;
        imageLoading.style.display = 'none';
    }
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
            handleSubmit();
        }
    });

    imagePromptInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleImageGeneration();
        }
    });
});
