let slideIndex = 0; 
const slides = document.getElementsByClassName("slide"); 
const dots = document.getElementsByClassName("dot"); 
let slideTimer = null; 

async function renderCart(cartItems = null) {     
    const cartCountBadge = document.getElementById('cart-count-badge');     
    const cartItemsList = document.getElementById('cart-items-list');     
    const cartTotalPrice = document.getElementById('cart-total-price');     
    if (!cartItems) {         
        try {             
            const response = await fetch('/api/cart/');             
            const result = await response.json();             
            cartItems = result.cart || [];         
        } catch (error) {             
            console.error("Cart fetch failed:", error);             
            cartItems = [];         
        }     
    }     
    const totalItems = cartItems.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);     
    const totalAmount = cartItems.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 0)), 0);     
    if (cartCountBadge) cartCountBadge.textContent = totalItems;     
    if (cartItemsList) {         
        cartItemsList.innerHTML = cartItems.length ? cartItems.map((item) => `             
            <div class="cart-item-row">                 
                <div>                     
                    <strong>${item.name}</strong><br>                     
                    <small> $${item.price} x ${item.quantity}</small>                 
                </div>                 
                <button class="remove-item-btn" data-item-name="${item.name}">Remove</button>             
            </div>         `).join('') : '<p>Your cart is empty.</p>';         
        cartItemsList.querySelectorAll('.remove-item-btn').forEach((button) => {             
            button.addEventListener('click', async () => {                 
                const name = button.getAttribute('data-item-name');                 
                await fetch('/api/cart/', {                     
                    method: 'POST',                     
                    headers: { 'Content-Type': 'application/json' },                     
                    body: JSON.stringify({ action: 'remove', name })                 
                });                 
                await renderCart();             
            });         
        });     
    }     
    if (cartTotalPrice) cartTotalPrice.textContent = ` $${totalAmount.toFixed(2)}`; 
}

async function handleCheckout() {     
    const customerName = document.querySelector('#payment-form input[name="customerName"]')?.value || '';     
    const address = document.querySelector('#payment-form input[name="address"]')?.value || '';     
    try {         
        const response = await fetch('/api/checkout/', {             
            method: 'POST',             
            headers: { 'Content-Type': 'application/json' },             
            body: JSON.stringify({ customer: customerName, address })         
        });         
        const result = await response.json();         
        const message = document.getElementById('payment-message');         
        if (message) {             
            message.textContent = result.success ? `${result.message}. Amount: $${result.amount}.` : result.message;         
        }         
        await renderCart([]);     
    } catch (error) {         
        console.error("Checkout failed:", error);     
    }  
}

function updateSlides() {     
    for (let i = 0; i < slides.length; i++) {         
        slides[i].classList.remove("active");         
        if (dots[i]) dots[i].classList.remove("active");     
    }     
    if (slides.length === 0) return;     
    slideIndex = ((slideIndex % slides.length) + slides.length) % slides.length;     
    slides[slideIndex].classList.add("active");     
    if (dots[slideIndex]) dots[slideIndex].classList.add("active"); 
}

function showSlidesAuto() {     
    updateSlides();     
    slideIndex = (slideIndex + 1) % Math.max(slides.length, 1);     
    slideTimer = setTimeout(showSlidesAuto, 5000); 
}

function changeSlide(n) {     
    clearTimeout(slideTimer);     
    slideIndex = slideIndex + n;     
    updateSlides();     
    slideTimer = setTimeout(showSlidesAuto, 5000); 
}

function currentSlide(n) {     
    clearTimeout(slideTimer);     
    slideIndex = n;     
    updateSlides();     
    slideTimer = setTimeout(showSlidesAuto, 3000); 
}

showSlidesAuto(); 
let uploadedImages = []; 

window.addEventListener('load', async function() {     
    const storedImages = localStorage.getItem('uploadedImages');     
    if (storedImages) {         
        uploadedImages = JSON.parse(storedImages);         
        renderProductsWithUpload();         
        localStorage.removeItem('uploadedImages');     
    } else {         
        renderProductsDefault();     
    }     
    await renderCart();     
    const cartTrigger = document.querySelector('.cart-trigger');     
    const cartPanel = document.getElementById('cart-panel');     
    if (cartTrigger && cartPanel) {         
        cartTrigger.addEventListener('click', (event) => {             
            event.stopPropagation();             
            cartPanel.classList.toggle('open');         
        });     
    }     
    document.addEventListener('click', () => {         
        if (cartPanel) cartPanel.classList.remove('open');     
    });     
    const checkoutBtn = document.getElementById('checkout-btn');     
    if (checkoutBtn) {         
        checkoutBtn.addEventListener('click', () => {             
            const modal = document.getElementById('payment-modal');             
            if (modal) modal.classList.remove('hidden');         
        });     
    }     
    const closePayment = document.getElementById('close-payment-modal');     
    const paymentModal = document.getElementById('payment-modal');     
    if (closePayment && paymentModal) {         
        closePayment.addEventListener('click', () => paymentModal.classList.add('hidden'));     
    }     
    if (paymentModal) {         
        paymentModal.addEventListener('click', (event) => {             
            if (event.target === paymentModal) paymentModal.classList.add('hidden');         
        });     
    }     
    const paymentForm = document.getElementById('payment-form');     
    if (paymentForm) {         
        paymentForm.addEventListener('submit', async (event) => {             
            event.preventDefault();             
            await handleCheckout();             
            paymentModal.classList.add('hidden');         
        });     
    } 
});

function attachProductActions(container) {     
    container.querySelectorAll('.add-to-cart-action-btn').forEach((button) => {         
        button.addEventListener('click', async function () {             
            const card = button.closest('.deal-card');             
            const productName = card?.querySelector('h3')?.textContent || 'Selected product';             
            const priceText = card?.querySelector('.product-price')?.textContent || '';             
            const price = parseFloat((priceText || '0').replace(/[^\d.]/g, ''));             
            
            try {                 
                const response = await fetch('/api/cart/', {                     
                    method: 'POST',                     
                    headers: { 'Content-Type': 'application/json' },                     
                    body: JSON.stringify({ item: { name: productName, price, quantity: 1 } })                 
                });                 
                const result = await response.json();                 
                if (result.success) {                     
                    await renderCart(result.cart);                     
                    
                    if (button.classList.contains('buy-now-action-btn')) {                         
                        const modal = document.getElementById('payment-modal');                         
                        if (modal) {                             
                            modal.classList.remove('hidden');                             
                            const message = document.getElementById('payment-message');                             
                            if (message) message.textContent = `${productName} ready for checkout (${priceText})`;                         
                        }                     
                    } else {                         
                        alert(`${productName} added to cart`);                     
                    }                 
                }             
            } catch (error) {                 
                console.error(error);                 
                alert('Could not add item to cart right now.');             
            }         
        });     
    }); 
}

function renderProductsDefault() {     
    const container = document.getElementById('product-list');     
    if (!container) return;     
    container.innerHTML = '';     
    const currentPage = window.location.pathname.split("/").pop();     
    let folderName = 'project1_images';     
    if (currentPage === 'books.html') folderName = 'books_images';     
    else if (currentPage === 'clothing.html') folderName = 'clothing_images';     
    else if (currentPage === 'electronics.html') folderName = 'electronic_images';     
    else if (currentPage === 'furniture.html') folderName = 'furniture_images';     
    else if (currentPage === 'grocery.html') folderName = 'grocery_images';     
    for (let i = 1; i <= 24; i++) {         
        const prices = [299, 499, 699, 399, 599, 499, 899, 799, 899, 999, 1099, 1199, 11199, 236, 526, 158, 4698, 458];         
        const discounts = [15, 20, 10, 25, 5, 30, 18, 22, 6, 8, 2, 5, 9, 5, 6, 2, 8, 5];         
        const price = prices[i - 1] || 300;         
        const discount = discounts[i - 1] || 10;         
        const ratings = [4.5, 3.9, 5.0, 4.2, 4.8, 3.7, 4.0, 4.6, 4.7, 4.6, 4.9, 5.0, 4.6, 4.9, 1.2, 2.3, 5.0, 2.0, 3.6, 4.3];         
        const rating = ratings[i - 1] || 4.0;         
        const imgSrc = `/static/${folderName}/product${i}.jpg`;         
        const card = document.createElement('div');         
        card.className = 'deal-card';         
        card.innerHTML = `             
            <div class="deal-image-box">                 
                <img src="${imgSrc}" onerror="this.onerror=null; this.src='https://via.placeholder.com/300x200?text=Product+${i}';" alt="Product ${i}">             
            </div>             
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">                 
                <div>                     
                    <h3 style="margin:8px 0 4px;font-size:16px">Product ${i}</h3>                     
                    <div class="product-price" style="color:#111;font-weight:700"> $${price}</div>                 
                </div>                 
                <div class="badge-container">                     
                    <span class="discount-tag">${discount}% OFF</span>                 
                </div>             
            </div>             
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">                 
                <button class="add-to-cart-action-btn">Add to cart</button>                 
                <span class="deal-status-text">${rating}   </span>             
            </div>             
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">                 
                <button class="add-to-cart-action-btn buy-now-action-btn">Buy Now</button>             
            </div>         `;         
        container.appendChild(card);     
    }     
    attachProductActions(container); 
}

function renderProductsWithUpload() {     
    const container = document.getElementById('product-list');     
    if (!container) return;     
    container.innerHTML = '';     
    for (let i = 1; i <= 24; i++) {         
        const price = 199 + i * 150;         
        const discount = 10 + (i % 5) * 5;         
        const rating = (3.5 + (i % 5) * 0.3).toFixed(1);         
        const imgSrc = uploadedImages[i - 1] || 'https://via.placeholder.com/300x200?text=Product+' + i;         
        const card = document.createElement('div');         
        card.className = 'deal-card';         
        card.innerHTML = `             
            <div class="deal-image-box">                 
                <img src="${imgSrc}" alt="Product ${i}">             
            </div>             
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">                 
                <div>                     
                    <h3 style="margin:8px 0 4px;font-size:16px">Product ${i}</h3>                     
                    <div class="product-price" style="color:#111;font-weight:700"> $${price}</div>                 
                </div>                 
                <div class="badge-container">                     
                    <span class="discount-tag">${discount}% OFF</span>                 
                </div>             
            </div>             
            <div style="display:flex;justify-content:space-between;margin-top:12px;">                 
                <button class="add-to-cart-action-btn">Add to cart</button>                 
                <span class="deal-status-text">${rating}   </span>             
            </div>             
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">                 
                <button class="add-to-cart-action-btn buy-now-action-btn">Buy Now</button>             
            </div>         `;         
        container.appendChild(card);     
    }     
    attachProductActions(container); 
}