let slideIndex = 0;   
const slides = document.getElementsByClassName("slide");   
const dots = document.getElementsByClassName("dot");    
let slideTimer = null;    

const translations = {     
    en: {         
        cart: "Add to Cart",         
        addToCart: "Add to cart",         
        buyNow: "Buy Now",         
        account: "Your Account",         
        yourOrder: "  Your Order",         
        yourWishList: "  Your Wish List",         
        yourRecommendations: "  Your Recommendations",         
        yourSellerAccount: "  Your Seller Account",         
        searchPlaceholder: "Search Annapurna ltd.co ...",         
        allCategory: "All Category",         
        electronics: "Electronics",         
        clothing: "Clothing",         
        books: "Books",         
        grocery: "Grocery",         
        furniture: "Furniture",         
        dealsTitle: "Recommended deals for you",         
        megaSaleTitle: "Mega Electronics sale",         
        megaSaleText: "Up to 50% off on Headset & Accessories",         
        shopNow: "Shop Now",         
        premiumTitle: "Premium T-Shirt",         
        premiumText: "New Arrivals: Adidas T-Shirt",         
        exploreMore: "Explore More",         
        smartStyleTitle: "Smart Style, Smart Life",         
        smartStyleText: "Best Deals On Glasses",         
        grabDeals: "Grab Deals",         
        shoesTitle: "Wings on your feet",         
        shoesText: "Branded Shoe OFF Upto 60%",         
        checkIt: "Check-It",         
        about: "About",         
        aboutText: "Small shop description. Quality products, fast delivery.",         
        quickLinks: "Quick Links",         
        home: "Home",         
        products: "Products",         
        contact: "Contact",         
        aboutUs: "About Us",         
        contactTitle: "Contact",         
        location: "Mango,dimna road",         
        email: "Email: ganeshkumar20200@gmail.com",         
        phone: "Phone: +91 7070078738",         
        follow: "Follow",         
        footerRights: "Your Website. All rights reserved."     
    } 
};

let currentLanguage = 'en';    

function changeLanguage(lang) {     
    const selected = translations[lang] || translations.en;     
    currentLanguage = lang;     
    document.documentElement.lang = lang;     
    document.querySelectorAll('[data-i18n]').forEach((element) => {         
        const key = element.getAttribute('data-i18n');         
        if (selected[key]) {             
            element.textContent = selected[key];         
        }     
    });     
    document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {         
        const key = element.getAttribute('data-i18n-placeholder');         
        if (selected[key]) {             
            element.setAttribute('placeholder', selected[key]);         
        }     
    });     
    document.querySelectorAll('.add-to-cart-action-btn').forEach((button) => {         
        button.textContent = selected.addToCart || 'Add to cart';     
    });     
    document.querySelectorAll('.buy-now-action-btn').forEach((button) => {         
        button.textContent = selected.buyNow || 'Buy Now';     
    }); 
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
changeLanguage('en');    
let uploadedImages = [];    

function attachProductActions(container) {     
    container.querySelectorAll('.add-to-cart-action-btn').forEach((button) => {         
        button.addEventListener('click', async function () {             
            const card = button.closest('.deal-card');             
            const productName = card?.querySelector('h3')?.textContent || 'Selected product';             
            const priceText = card?.querySelector('.product-price')?.textContent || '';             
            const price = parseFloat((priceText || '0').replace(/[^\d.]/g, ''));             
            
            try {                 
                // FIX: Buy Now ho ya Add to Cart, pehle backend cart me save hoga!
                const response = await fetch('/api/cart/', {                     
                    method: 'POST',                     
                    headers: { 'Content-Type': 'application/json' },                     
                    body: JSON.stringify({ item: { name: productName, price, quantity: 1 } })                 
                });                 
                const result = await response.json();                 
                if (result.success) {                     
                    await renderCart(result.cart);                     
                    
                    if (button.classList.contains('buy-now-action-btn')) {                         
                        openCheckoutModal(productName, price);                         
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

async function renderCart(cartItems = null) {     
    const cartCountBadge = document.getElementById('cart-count-badge');     
    const cartItemsList = document.getElementById('cart-items-list');     
    const cartTotalPrice = document.getElementById('cart-total-price');     
    if (!cartItems) {         
        const response = await fetch('/api/cart/');         
        const result = await response.json();         
        cartItems = result.cart || [];     
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
    if (cartTotalPrice) cartTotalPrice.textContent = ` ${totalAmount.toFixed(2)}`; 
}

function openCheckoutModal(productName = '', price = 0) {     
    const modal = document.getElementById('payment-modal');     
    const message = document.getElementById('payment-message');     
    if (modal) modal.classList.remove('hidden');     
    if (message) message.textContent = productName ? `${productName} ready for checkout ($${price.toFixed(2)})` : 'Ready for checkout'; 
    togglePaymentInputs(document.querySelector('input[name="paymentMethod"]:checked')?.value || 'COD');
}

function togglePaymentInputs(method) {
    const upiFields = document.getElementById('upi-fields');
    const cardFields = document.getElementById('card-fields');
    const upiInput = document.getElementById('upiIdInput');
    const cardInputs = document.querySelectorAll('#card-fields input');

    if (upiFields) upiFields.classList.toggle('hidden', method !== 'UPI');
    if (cardFields) cardFields.classList.toggle('hidden', method !== 'CARD');
    if (upiInput) upiInput.required = method === 'UPI';
    cardInputs.forEach((input) => {
        input.required = method === 'CARD';
    });
}

function showLoading() {     
    const loader = document.getElementById('loading-overlay');     
    if(loader) loader.classList.remove('hidden'); 
}

function hideLoading() {     
    const loader = document.getElementById('loading-overlay');     
    if(loader) loader.classList.add('hidden'); 
}

async function handleCheckout() {     
    const customerName = document.querySelector('#payment-form input[name="customerName"]')?.value || '';     
    const address = document.querySelector('#payment-form input[name="address"]')?.value || '';          
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'COD';     
    const upiId = document.getElementById('upiIdInput')?.value || '';     
    showLoading();        
    try {         
        const response = await fetch('/api/checkout/', {             
            method: 'POST',             
            headers: { 'Content-Type': 'application/json' },             
            body: JSON.stringify({                  
                customer: customerName,                  
                address: address,                 
                payment_method: paymentMethod,                  
                upi_id: upiId             
            })         
        });         
        const result = await response.json();         
        const message = document.getElementById('payment-message');         
        if (message) {             
            message.textContent = result.success ? `${result.message}. Amount: ${result.amount}.` : result.message;         
        }
        if (!response.ok || !result.success) {
            alert(result.message || 'Could not place order right now.');
            return false;
        }
        await renderCart([]);
        alert("Order successfully placed!");
        return true;
    } catch (error) {         
        console.error("Checkout failed:", error);
        alert('Checkout failed. Please try again.');
        return false;
    } finally {         
        hideLoading();        
    } 
}

window.addEventListener('load', function() {     
    const storedImages = localStorage.getItem('uploadedImages');     
    if (storedImages) {         
        uploadedImages = JSON.parse(storedImages);         
        renderProductsWithUpload();         
        localStorage.removeItem('uploadedImages');     
    } else {         
        renderProductsDefault();     
    }     
    renderCart();               
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
        checkoutBtn.addEventListener('click', () => openCheckoutModal());     
    }     
    const closePayment = document.getElementById('close-payment-modal');     
    const paymentModal = document.getElementById('payment-modal');     
    if (closePayment && paymentModal) {         
        closePayment.addEventListener('click', () => paymentModal.classList.add('hidden'));     
    }     
    const paymentForm = document.getElementById('payment-form');     
    if (paymentForm) {         
        paymentForm.querySelectorAll('input[name="paymentMethod"]').forEach((input) => {
            input.addEventListener('change', () => togglePaymentInputs(input.value));
        });
        togglePaymentInputs(paymentForm.querySelector('input[name="paymentMethod"]:checked')?.value || 'COD');
        paymentForm.addEventListener('submit', async (event) => {             
            event.preventDefault();             
            const orderPlaced = await handleCheckout();             
            if (orderPlaced && paymentModal) paymentModal.classList.add('hidden');         
        });     
    } 
});

function renderProductsDefault() {     
    const container = document.getElementById('product-list');     
    if (!container) return;     
    container.innerHTML = '';               
    const currentPage = window.location.pathname.split("/").pop();     
    let folderName = 'project1_images';               
    if (currentPage === 'books.html') {         
        folderName = 'books_images';     
    } else if (currentPage === 'clothing.html') {         
        folderName = 'clothing_images';     
    } else if (currentPage === 'electronics.html') {         
        folderName = 'electronic_images';     
    } else if (currentPage === 'furniture.html') {         
        folderName = 'furniture_images';     
    } else if (currentPage === 'grocery.html') {         
        folderName = 'grocery_images';     
    }     
    for (let i = 1; i <= 24; i++) {         
        const prices = [299, 499, 699, 399, 599, 499, 899, 799, 899, 999, 1099, 1199, 11199, 236, 526, 158, 4698, 458];         
        const discounts = [15, 20, 10, 25, 5, 30, 18, 22, 6, 8, 2, 5, 9, 5, 6, 2, 8, 5];         
        const price = prices[i - 1] || 300;         
        const discount = discounts[i - 1] || 10;         
        const ratings = [4.5, 3.9, 5.0, 4.2, 4.8, 3.7, 4.0, 4.6, 4.7, 4.6, 4.9, 5.0, 4.6, 4.9, 1.2, 2.3, 5.0, 2.0, 3.6, 4.3];         
        const rating = ratings[i - 1] || 4.0;                           
        const localImgSrc = `/static/${folderName}/product${i}.jpg`;          
        const fallbackImg = `https://via.placeholder.com/300x200?text=Product+${i}`;         
        const card = document.createElement('div');         
        card.className = 'deal-card';         
        card.innerHTML = `             
            <div class="deal-image-box">                 
                <img src="${localImgSrc}" onerror="this.onerror=null; this.src='${fallbackImg}';" alt="Product ${i}">             
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
                <span class="deal-status-text">${rating}  </span>             
            </div>             
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">                 
                <button class="add-to-cart-action-btn buy-now-action-btn">Buy Now</button>             
            </div>         
        `;         
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
                <img src="clothing_images/product${i}.jpg" alt="Product ${i}">             
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
                <span class="deal-status-text">${rating}  </span>             
            </div>             
            <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;">                 
                <button class="add-to-cart-action-btn buy-now-action-btn">Buy Now</button>             
            </div>         
        `;         
        container.appendChild(card);     
    }     
    attachProductActions(container); 
}
