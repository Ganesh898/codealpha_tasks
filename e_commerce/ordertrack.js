document.addEventListener('DOMContentLoaded', () => {
    const trackBtn = document.getElementById('track-btn');
    const orderIdInput = document.getElementById('order-id-input');
    const displayOrderId = document.getElementById('display-order-id');
    const estimatedDelivery = document.getElementById('estimated-delivery');
    const messageBox = document.getElementById('track-message');
    const recentOrders = document.getElementById('recent-orders');

    function normalizeOrderId(value) {
        return value.replace(/^#?AP-/i, '').replace(/^#/, '').trim();
    }

    function setMessage(text, isError = false) {
        messageBox.textContent = text;
        messageBox.classList.toggle('error', isError);
    }

    function renderTimeline(order) {
        displayOrderId.textContent = order.display_id;
        estimatedDelivery.textContent = order.estimated_delivery;

        const steps = document.querySelectorAll('.timeline-step');
        steps.forEach((step) => {
            step.classList.remove('completed', 'active', 'pending');
            step.classList.add('pending');
        });

        const activeIndex = order.status === 'Packed & Ready' ? 1 : 0;
        steps.forEach((step, index) => {
            step.classList.remove('pending');
            if (index < activeIndex) {
                step.classList.add('completed');
                step.querySelector('.status-marker').textContent = 'OK';
            } else if (index === activeIndex) {
                step.classList.add('active');
                step.querySelector('.status-marker').textContent = String(index + 1);
            } else {
                step.classList.add('pending');
                step.querySelector('.status-marker').textContent = String(index + 1);
            }
        });

        const placedTime = new Date(order.created_at).toLocaleString();
        const firstStepTime = document.querySelector('.timeline-step:first-child .status-time');
        if (firstStepTime) firstStepTime.textContent = placedTime;

        setMessage(`Order found: ${order.items.length} item(s), total $${order.amount}.`);
    }

    function renderRecentOrders(orders) {
        if (!recentOrders) return;
        if (!orders.length) {
            recentOrders.innerHTML = '<p>No orders found for your account yet.</p>';
            return;
        }

        recentOrders.innerHTML = `
            <h3>Your Recent Orders</h3>
            ${orders.map((order) => `
                <button type="button" class="recent-order-btn" data-order-id="${order.id}">
                    ${order.display_id} - $${order.amount} - ${order.status}
                </button>
            `).join('')}
        `;

        recentOrders.querySelectorAll('.recent-order-btn').forEach((button) => {
            button.addEventListener('click', () => loadOrder(button.dataset.orderId));
        });
    }

    async function loadOrder(orderId) {
        if (!orderId) {
            setMessage('Kripya valid Order ID daalein.', true);
            return;
        }

        setMessage('Tracking order...');
        try {
            const response = await fetch(`/api/orders/${orderId}/`);
            const result = await response.json();
            if (!response.ok || !result.success) {
                setMessage(result.message || 'Order nahi mila.', true);
                return;
            }
            renderTimeline(result.order);
        } catch (error) {
            console.error(error);
            setMessage('Order track karne me problem aa rahi hai.', true);
        }
    }

    async function loadRecentOrders() {
        try {
            const response = await fetch('/api/orders/');
            const result = await response.json();
            const orders = result.orders || [];
            renderRecentOrders(orders);
            if (orders.length) renderTimeline(orders[0]);
        } catch (error) {
            console.error(error);
            setMessage('Recent orders load nahi ho paaye.', true);
        }
    }

    trackBtn.addEventListener('click', () => {
        loadOrder(normalizeOrderId(orderIdInput.value));
    });

    orderIdInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            loadOrder(normalizeOrderId(orderIdInput.value));
        }
    });

    loadRecentOrders();
});
