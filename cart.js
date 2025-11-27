// ==========================================
// SHOPPING CART SYSTEM
// ==========================================

// Storage key
const CART_KEY = 'oblivions_cart';

// Product Catalog
const PRODUCTS = [
    { id: 1, name: "Void Hoodie", price: 1299, image: "placeholder" },
    { id: 2, name: "Shadow Tee", price: 699, image: "placeholder" },
    { id: 3, name: "Abyss Jacket", price: 2499, image: "placeholder" },
    { id: 4, name: "Eclipse Pants", price: 1599, image: "placeholder" }
];

// ==========================================
// CART MANAGEMENT FUNCTIONS
// ==========================================

// Get cart from localStorage
function getCart() {
    const cart = localStorage.getItem(CART_KEY);
    return cart ? JSON.parse(cart) : { items: [] };
}

// Save cart to localStorage
function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartBadge();
}

// Get product by ID
function getProduct(productId) {
    return PRODUCTS.find(p => p.id === productId);
}

// Add product to cart or increment quantity
function addToCart(productId) {
    const cart = getCart();
    const product = getProduct(productId);

    if (!product) {
        console.error('Product not found:', productId);
        return;
    }

    // Check if product already in cart
    const existingItem = cart.items.find(item => item.productId === productId);

    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.items.push({
            productId: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
            image: product.image
        });
    }

    saveCart(cart);
    return cart;
}

// Remove product from cart completely
function removeFromCart(productId) {
    const cart = getCart();
    cart.items = cart.items.filter(item => item.productId !== productId);
    saveCart(cart);
    return cart;
}

// Update quantity of a product
function updateQuantity(productId, quantity) {
    const cart = getCart();
    const item = cart.items.find(item => item.productId === productId);

    if (!item) return cart;

    if (quantity <= 0) {
        // Remove item if quantity is 0 or less
        return removeFromCart(productId);
    }

    item.quantity = quantity;
    saveCart(cart);
    return cart;
}

// Get cart total price
function getCartTotal() {
    const cart = getCart();
    return cart.items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

// Get total number of items in cart
function getCartCount() {
    const cart = getCart();
    return cart.items.reduce((count, item) => count + item.quantity, 0);
}

// Clear entire cart
function clearCart() {
    saveCart({ items: [] });
}

// Update cart badge in navigation
function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (badge) {
        const count = getCartCount();
        badge.textContent = count;

        // Add pulse animation
        if (count > 0) {
            badge.classList.add('pulse');
            setTimeout(() => badge.classList.remove('pulse'), 300);
        }
    }
}

// Format price in Czech Koruna
function formatPrice(price) {
    return new Intl.NumberFormat('cs-CZ', {
        style: 'decimal',
        minimumFractionDigits: 0
    }).format(price) + ' Kč';
}

// ==========================================
// MAIN PAGE - ADD TO CART BUTTONS
// ==========================================

if (window.location.pathname.includes('index.html') || window.location.pathname === '/' ||
    (!window.location.pathname.includes('cart.html') && !window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html'))) {

    document.addEventListener('DOMContentLoaded', () => {
        // Update badge on page load
        updateCartBadge();

        // Make cart icon clickable
        const cartIcon = document.querySelector('.cart-icon-container');
        if (cartIcon) {
            cartIcon.style.cursor = 'pointer';
            cartIcon.addEventListener('click', () => {
                window.location.href = 'cart.html';
            });
        }

        // Add "Add to Cart" buttons to products
        const clothingItems = document.querySelectorAll('.clothing-item');
        clothingItems.forEach((item, index) => {
            const productId = index + 1; // IDs 1-4

            // Create add to cart button
            const button = document.createElement('button');
            button.className = 'add-to-cart-btn';
            button.textContent = 'ADD TO CART';
            button.setAttribute('data-product-id', productId);

            // Add click handler
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                addToCart(productId);

                // Play success sound
                if (window.audioManager) {
                    window.audioManager.playSuccess();
                }

                // Show brief confirmation
                button.textContent = 'ADDED! ✓';
                button.classList.add('added');

                setTimeout(() => {
                    button.textContent = 'ADD TO CART';
                    button.classList.remove('added');
                }, 1500);
            });

            // Insert button after price
            const price = item.querySelector('.price');
            if (price) {
                price.insertAdjacentElement('afterend', button);
            }
        });
    });
}

// ==========================================
// CART PAGE - DISPLAY AND MANAGEMENT
// ==========================================

if (window.location.pathname.includes('cart.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        renderCart();

        // Continue shopping button
        const continueBtn = document.getElementById('continue-shopping');
        if (continueBtn) {
            continueBtn.addEventListener('click', () => {
                window.location.href = 'index.html?skipLanding=true#obleceni';
            });
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                alert('Checkout feature coming soon!');
                // TODO: Implement checkout flow
            });
        }
    });
}

// Render cart items and summary
function renderCart() {
    const cart = getCart();
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyState = document.getElementById('empty-cart');
    const cartSummary = document.getElementById('cart-summary');

    if (!cartItemsContainer) return;

    // Show empty state or cart items
    if (cart.items.length === 0) {
        if (emptyState) emptyState.style.display = 'flex';
        if (cartSummary) cartSummary.style.display = 'none';
        cartItemsContainer.innerHTML = '';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (cartSummary) cartSummary.style.display = 'block';

    // Render cart items
    cartItemsContainer.innerHTML = cart.items.map(item => `
        <div class="cart-item" data-product-id="${item.productId}">
            <div class="cart-item-image">
                <div class="organic-texture"></div>
            </div>
            <div class="cart-item-details">
                <h3 class="cart-item-name">${item.name}</h3>
                <p class="cart-item-price">${formatPrice(item.price)}</p>
            </div>
            <div class="cart-item-quantity">
                <button class="qty-btn qty-decrease" data-product-id="${item.productId}">−</button>
                <input type="number" class="qty-input" value="${item.quantity}" min="1" data-product-id="${item.productId}">
                <button class="qty-btn qty-increase" data-product-id="${item.productId}">+</button>
            </div>
            <div class="cart-item-subtotal">
                <p>${formatPrice(item.price * item.quantity)}</p>
            </div>
            <button class="cart-item-remove" data-product-id="${item.productId}">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `).join('');

    // Update summary
    updateCartSummary();

    // Add event listeners
    attachCartEventListeners();
}

// Update cart summary (totals)
function updateCartSummary() {
    const cart = getCart();
    const itemCount = getCartCount();
    const total = getCartTotal();

    const itemCountEl = document.getElementById('cart-item-count');
    const totalEl = document.getElementById('cart-total');

    if (itemCountEl) {
        itemCountEl.textContent = `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`;
    }

    if (totalEl) {
        totalEl.textContent = formatPrice(total);
    }
}

// Attach event listeners to cart controls
function attachCartEventListeners() {
    // Quantity decrease buttons
    document.querySelectorAll('.qty-decrease').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.getAttribute('data-product-id'));
            const input = document.querySelector(`.qty-input[data-product-id="${productId}"]`);
            const currentQty = parseInt(input.value);
            if (currentQty > 1) {
                updateQuantity(productId, currentQty - 1);
                renderCart();
            }
        });
    });

    // Quantity increase buttons
    document.querySelectorAll('.qty-increase').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.getAttribute('data-product-id'));
            const input = document.querySelector(`.qty-input[data-product-id="${productId}"]`);
            const currentQty = parseInt(input.value);
            updateQuantity(productId, currentQty + 1);
            renderCart();
        });
    });

    // Quantity input direct change
    document.querySelectorAll('.qty-input').forEach(input => {
        input.addEventListener('change', () => {
            const productId = parseInt(input.getAttribute('data-product-id'));
            const newQty = parseInt(input.value);
            if (newQty > 0) {
                updateQuantity(productId, newQty);
                renderCart();
            } else {
                input.value = 1;
            }
        });
    });

    // Remove buttons
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = parseInt(btn.getAttribute('data-product-id'));
            const cartItem = btn.closest('.cart-item');

            // Add fade out animation
            cartItem.style.animation = 'fadeOut 0.3s ease';

            setTimeout(() => {
                removeFromCart(productId);
                renderCart();
            }, 300);
        });
    });
}

// Export functions for use in other scripts
window.cartSystem = {
    addToCart,
    removeFromCart,
    updateQuantity,
    getCart,
    getCartTotal,
    getCartCount,
    clearCart,
    updateCartBadge
};
