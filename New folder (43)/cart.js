document.addEventListener('DOMContentLoaded', function() {
    const cartList = document.getElementById('cartList');
    const cartTotal = document.getElementById('cartTotal');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    function updateCart() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        console.log('Current cart:', cart); // Debug log
        
        if (cart.length === 0) {
            cartList.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            cartTotal.textContent = '$0.00';
            checkoutBtn.style.display = 'none';
            return;
        }
        
        let total = 0;
        cartList.innerHTML = cart.map(item => {
            total += parseFloat(item.price);
            return `
                <div class="cart-item">
                    <div class="cart-item-details">
                        <h3>${item.title}</h3>
                        <p>Price: $${item.price}</p>
                        <p class="stock-info">Item: ${item.stock}</p>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" class="remove-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
        }).join('');
        
        cartTotal.textContent = `$${total.toFixed(2)}`;
        checkoutBtn.style.display = 'block';
    }
    
    window.removeFromCart = function(itemId) {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const updatedCart = cart.filter(item => item.id !== itemId);
        localStorage.setItem('cart', JSON.stringify(updatedCart));
        updateCart();
        updateCartCount();
    };
    
    window.updateCartCount = function() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            cartCount.textContent = cart.length;
        }
    };

    // Handle checkout button
    checkoutBtn?.addEventListener('click', async function(e) {
        e.preventDefault();
        console.log('Checkout clicked');
        
        // Check if user is logged in
        const isLoggedIn = localStorage.getItem('customerLoggedIn') === 'true';
        if (!isLoggedIn) {
            alert('Please login first');
            window.location.href = 'customer-login.html';
            return;
        }

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        if (cart.length === 0) {
            alert('Your cart is empty');
            return;
        }
        
        try {
            console.log('Creating Stripe session...'); // Debug log
            const orderId = 'st_' + Math.random().toString(36).substring(2, 8);
            const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
            
            const response = await fetch('/api/create-stripe-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    product_name: 'Cart Checkout',
                    price: total,
                    order_id: orderId,
                    customer_email: localStorage.getItem('customerEmail'),
                    items: cart.map(item => item.stock),
                    success_url: window.location.origin + `/customer-panel.html?order_id=${orderId}&status=success`,
                    cancel_url: window.location.href
                })
            });

            console.log('Response:', response); // Debug log

            if (!response.ok) {
                throw new Error('Failed to create checkout session');
            }

            const session = await response.json();
            console.log('Session:', session); // Debug log

            // Save pending order
            const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
            pendingOrders.push({
                id: orderId,
                product: 'Cart Checkout',
                price: total,
                items: cart.map(item => ({
                    title: item.title,
                    stock: item.stock
                })),
                timestamp: Date.now()
            });
            localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));

            // Redirect to Stripe checkout
            const { error } = await stripe.redirectToCheckout({
                sessionId: session.id
            });

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert('Checkout failed: ' + error.message);
        }
    });
    
    // Initialize cart
    updateCart();
    updateCartCount();
}); 