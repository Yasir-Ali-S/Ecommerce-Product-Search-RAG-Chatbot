// ===== GLOBAL VARIABLES =====
let chatHistory = [];
let isLoading = false;

// ===== DOM ELEMENTS =====
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const sendBtn = document.getElementById('send-btn');
const chatMessages = document.getElementById('chat-messages');
const welcomeSection = document.getElementById('welcome-section');
const chatSection = document.getElementById('chat-section');
const loadingTemplate = document.getElementById('loading-template');

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Add event listeners
    chatForm.addEventListener('submit', handleChatSubmit);
    chatInput.addEventListener('keypress', handleKeyPress);
    chatInput.addEventListener('input', handleInputChange);
    
    // Focus on input
    chatInput.focus();
    
    // Add smooth scrolling
    chatMessages.addEventListener('scroll', handleScroll);
}

// ===== EVENT HANDLERS =====
function handleChatSubmit(e) {
    e.preventDefault();
    const question = chatInput.value.trim();
    
    if (!question) {
        return;
    }
    
    sendMessage(question);
}

function handleKeyPress(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const question = chatInput.value.trim();
        
        if (!question) {
            return;
        }
        
        sendMessage(question);
    }
}

function handleInputChange() {
    const question = chatInput.value.trim();
    sendBtn.disabled = !question || isLoading;
}

function handleScroll() {
    // Auto-scroll to bottom when new messages are added
    if (chatMessages.scrollTop + chatMessages.clientHeight >= chatMessages.scrollHeight - 10) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

// ===== MESSAGE HANDLING =====
async function sendMessage(question) {
    if (isLoading) return;
    
    // Hide welcome section on first message
    if (chatHistory.length === 0) {
        hideWelcomeSection();
    }
    
    // Add user message to chat
    addUserMessage(question);
    
    // Clear input
    chatInput.value = '';
    sendBtn.disabled = true;
    
    // Show loading state
    isLoading = true;
    const loadingElement = showLoadingMessage();
    
    try {
        // Make API call
        const response = await fetch('/api/chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ question: question })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Remove loading message
        loadingElement.remove();
        
        // Add AI response
        addAIResponse(data);
        
        // Add to chat history
        chatHistory.push({
            question: question,
            response: data
        });
        
    } catch (error) {
        console.error('Error:', error);
        
        // Remove loading message
        loadingElement.remove();
        
        // Show error message
        addErrorMessage('Sorry, I encountered an error while processing your request. Please try again.');
    } finally {
        isLoading = false;
        sendBtn.disabled = false;
        chatInput.focus();
    }
}

// ===== UI UPDATES =====
function addUserMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message user-message';
    messageElement.innerHTML = `
        <div class="message-content">
            ${escapeHtml(message)}
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

function addAIResponse(data) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message ai-message';
    
    let content = `
        <div class="message-content">
            <div class="message-text">
                ${escapeHtml(data.message)}
            </div>
    `;
    
    // Add products if available - now properly nested within message-content
    if (data.products && data.products.length > 0) {
        content += createProductsContainer(data.products);
    }
    
    content += `</div>`;
    
    messageElement.innerHTML = content;
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

function addErrorMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message ai-message';
    messageElement.innerHTML = `
        <div class="message-content error-message">
            <i class="fas fa-exclamation-triangle me-2"></i>
            ${escapeHtml(message)}
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

function showLoadingMessage() {
    const loadingElement = loadingTemplate.content.cloneNode(true);
    chatMessages.appendChild(loadingElement);
    scrollToBottom();
    return chatMessages.lastElementChild;
}

function createProductsContainer(products) {
    let productsHTML = `
        <div class="products-container">
            <div class="products-grid">
    `;
    
    products.forEach(product => {
        productsHTML += createProductCard(product);
    });
    
    productsHTML += `
            </div>
        </div>
    `;
    
    return productsHTML;
}

function createProductCard(product) {
    const similarityPercentage = Math.round(product.similarity_score * 100);
    const ratingStars = generateRatingStars(product.rating);
    
    return `
        <div class="product-card">
            <div class="product-image">
                ${product.image_url ? 
                    `<img src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : 
                    ''
                }
                <div class="product-image-placeholder" style="${product.image_url ? 'display: none;' : 'display: flex;'}">
                    <i class="fas fa-image"></i>
                </div>
            </div>
            <div class="product-content">
                <h3 class="product-title">${escapeHtml(product.title)}</h3>
                <p class="product-description">${escapeHtml(product.description)}</p>
                
                <div class="product-meta">
                    <span class="product-price">₹${product.price}</span>
                    <span class="product-brand">${escapeHtml(product.brand)}</span>
                </div>
                
                <div class="product-details">
                    <div class="product-rating">
                        ${ratingStars}
                        <span>(${product.num_reviews})</span>
                    </div>
                    <span class="similarity-score">${similarityPercentage}% match</span>
                </div>
                
                ${product.available_sizes && product.available_sizes.length > 0 ? 
                    `<div class="mt-2">
                        <small class="text-muted">
                            <i class="fas fa-tags me-1"></i>
                            Sizes: ${product.available_sizes.join(', ')}
                        </small>
                    </div>` : 
                    ''
                }
                
                ${product.color ? 
                    `<div class="mt-1">
                        <small class="text-muted">
                            <i class="fas fa-palette me-1"></i>
                            Color: ${escapeHtml(product.color)}
                        </small>
                    </div>` : 
                    ''
                }
            </div>
        </div>
    `;
}

function generateRatingStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let stars = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function hideWelcomeSection() {
    welcomeSection.style.display = 'none';
    chatSection.style.display = 'block';
}

function scrollToBottom() {
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(price);
}

// ===== ANIMATION HELPERS =====
function addFadeInAnimation(element) {
    element.classList.add('fade-in');
}

function addSlideUpAnimation(element) {
    element.classList.add('slide-up');
}

// ===== ERROR HANDLING =====
function handleNetworkError() {
    addErrorMessage('Network error. Please check your internet connection and try again.');
}

function handleServerError(status) {
    let message = 'Server error occurred. Please try again later.';
    
    if (status === 404) {
        message = 'Service not found. Please contact support.';
    } else if (status === 500) {
        message = 'Internal server error. Please try again later.';
    }
    
    addErrorMessage(message);
}

// ===== ACCESSIBILITY =====
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// ===== PERFORMANCE OPTIMIZATION =====
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced scroll handler
const debouncedScrollHandler = debounce(handleScroll, 100);

// ===== EXPORT FOR TESTING =====
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        sendMessage,
        addUserMessage,
        addAIResponse,
        createProductCard,
        escapeHtml,
        formatPrice
    };
} 