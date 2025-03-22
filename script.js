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
        const result = await callWorker(promptInput.value);
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
