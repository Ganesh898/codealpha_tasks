document.addEventListener('DOMContentLoaded', () => {
    // Cart Data Array
    let cart = [];

    // DOM Elements
    const cartIconBtn = document.getElementById('cart-icon-btn');
    const cartDropdown = document.getElementById('cart-dropdown');
    const cartCount = document.getElementById('cart-count');
    const cartItemsList = document.getElementById('cart-items-list');
    const cartTotalPrice = document.getElementById('cart-total-price');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    // 1. Toggle Cart Dropdown View
    cartIconBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        cartDropdown.classList.toggle('show');
    });

    // Close cart dropdown if user clicks outside
    document.addEventListener('click', () => {
        cartDropdown.classList.remove('show');
    });
    cartDropdown.addEventListener('click', (e) => e.stopPropagation());

    // 2. Add to Cart Click Functionality
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            const name = button.getAttribute('data-name');
            const price = parseFloat(button.getAttribute('data-price'));

            // Check if item already exists in cart
            const existingItem = cart.find(item => item.id === id);

            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({ id, name, price, quantity: 1 });
            }

            updateCartUI();
        });
    });

    // 3. Update Cart User Interface (UI)
    function updateCartUI() {
        // Clear previous list
        cartItemsList.innerHTML = '';

        if (cart.length === 0) {
            cartItemsList.innerHTML = '<p class="empty-msg">Your cart is empty</p>';
            cartCount.textContent = '0';
            cartTotalPrice.textContent = '0.00';
            return;
        }

        let totalItems = 0;
        let totalPrice = 0;

        // Render each item row
        cart.forEach(item => {
            totalItems += item.quantity;
            totalPrice += item.price * item.quantity;

            const itemRow = document.createElement('div');
            itemRow.classList.add('cart-item-row');
            itemRow.innerHTML = `
                <div>
                    <strong>${item.name}</strong> <br>
                    <small>$${item.price} x ${item.quantity}</small>
                </div>
                <button class="remove-item-btn" data-id="${item.id}">✕</button>
            `;
            cartItemsList.appendChild(itemRow);
        });

        // Update Count & Total Price
        cartCount.textContent = totalItems;
        cartTotalPrice.textContent = totalPrice.toFixed(2);

        // Add Delete Event Listeners to Remove buttons
        const removeButtons = document.querySelectorAll('.remove-item-btn');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const idToRemove = btn.getAttribute('data-id');
                removeItemFromCart(idToRemove);
            });
        });
    }

    // 4. Remove Item Function
    function removeItemFromCart(id) {
        cart = cart.filter(item => item.id !== id);
        updateCartUI();
    }
});