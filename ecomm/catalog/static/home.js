// Floating Chat Widget Logic
const chatBubble = document.getElementById('chat-bubble');
const chatWindow = document.getElementById('chat-window');
const chatClose = document.getElementById('chat-close');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatBody = document.getElementById('chat-body');

// Change greeting message
document.addEventListener('DOMContentLoaded', function() {
    chatBody.innerHTML = '<div class="chat-message bot">Hi! 👋 I can help you find products in our store. Just type what you are looking for and I’ll show you the best matches from our catalog!</div>';
});

chatBubble.addEventListener('click', () => {
    chatWindow.classList.remove('hidden');
    chatInput.focus();
});
chatClose.addEventListener('click', () => {
    chatWindow.classList.add('hidden');
});

chatForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const msg = chatInput.value.trim();
    if (!msg) return;
    addUserMessage(msg);
    chatInput.value = '';
    chatBody.scrollTop = chatBody.scrollHeight;
    addBotMessage('Searching for products...');
    try {
        const response = await fetch('/chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify({ question: msg })
        });
        if (!response.ok) {
            throw new Error('Server error');
        }
        const data = await response.json();
        // Remove the loading message
        removeLastBotMessage();
        addBotMessage(data.message);
        if (data.products && data.products.length > 0) {
            addProductCards(data.products);
        }
    } catch (err) {
        removeLastBotMessage();
        addBotMessage('Sorry, something went wrong. Please try again.');
    }
    chatBody.scrollTop = chatBody.scrollHeight;
});

function addUserMessage(msg) {
    const div = document.createElement('div');
    div.className = 'chat-message user';
    div.textContent = msg;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}
function addBotMessage(msg) {
    const div = document.createElement('div');
    div.className = 'chat-message bot';
    div.textContent = msg;
    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}
function removeLastBotMessage() {
    const messages = chatBody.querySelectorAll('.chat-message.bot');
    if (messages.length > 0) {
        messages[messages.length - 1].remove();
    }
}
function addProductCards(products) {
    const container = document.createElement('div');
    container.className = 'chat-products-container';
    products.forEach(product => {
        container.appendChild(createProductCard(product));
    });
    chatBody.appendChild(container);
    chatBody.scrollTop = chatBody.scrollHeight;
}
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'chat-product-card';
    card.innerHTML = `
        <div class="chat-product-img-wrap">
            <img src="${product.image_url || 'https://via.placeholder.com/80'}" alt="${product.title}">
        </div>
        <div class="chat-product-info">
            <div class="chat-product-title">${product.title}</div>
            <div class="chat-product-brand">${product.brand || ''}</div>
            <div class="chat-product-price">₹${product.price}</div>
        </div>
    `;
    card.style.cursor = 'pointer';
    card.onclick = () => {
        window.location.href = `/products/${product.id}/`;
    };
    return card;
} 