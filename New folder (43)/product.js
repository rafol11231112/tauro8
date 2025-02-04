document.addEventListener('DOMContentLoaded', function() {
    // Check login first
    const isLoggedIn = localStorage.getItem('customerLoggedIn') === 'true';
    if (!isLoggedIn) {
        window.location.href = 'customer-login.html';
        return;
    }

    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    // Get elements
    const productTitle = document.getElementById('productTitle');
    const productPrice = document.getElementById('productPrice');
    const productDescription = document.getElementById('productDescription');
    const stockSelect = document.getElementById('stockSelect');
    const paymentOptions = document.getElementById('paymentOptions');
    const buyButton = document.getElementById('buyButton');

    // Get products from localStorage
    const products = JSON.parse(localStorage.getItem('storeProducts')) || [];
    const product = products[productId];

    if (product) {
        // Display product details
        productTitle.textContent = product.title;
        productPrice.textContent = `$${product.price.toFixed(2)}`;
        productDescription.textContent = product.description;

        // Just show "In Stock" status instead of actual items
        if (product.stock && product.stock.length > 0) {
            stockSelect.innerHTML = `
                <option value="">Select to purchase</option>
                <option value="0">1 Item - $${product.price.toFixed(2)}</option>
            `;
        } else {
            stockSelect.innerHTML = '<option value="">Out of Stock</option>';
            buyButton.disabled = true;
        }

        // Add payment methods
        product.payment_methods.forEach(method => {
            const btn = document.createElement('button');
            btn.className = 'payment-option';
            btn.dataset.method = method;
            
            switch(method) {
                case 'crypto':
                    btn.innerHTML = '<i class="fab fa-bitcoin"></i> Crypto';
                    break;
                case 'paypal':
                    btn.innerHTML = '<i class="fab fa-paypal"></i> PayPal';
                    break;
                case 'card':
                    btn.innerHTML = '<i class="fas fa-credit-card"></i> Card';
                    break;
                case 'hood':
                    btn.innerHTML = '<i class="fas fa-mask"></i> Hood Pay';
                    break;
            }
            
            btn.onclick = function() {
                document.querySelectorAll('.payment-option').forEach(b => b.classList.remove('selected'));
                this.classList.add('selected');
                if (stockSelect.value) {
                    buyButton.disabled = false;
                }
            };
            
            paymentOptions.appendChild(btn);
        });

        // Handle stock selection
        stockSelect.onchange = function() {
            buyButton.disabled = !this.value || !document.querySelector('.payment-option.selected');
        };

        // Add Stripe script to head
        const stripeScript = document.createElement('script');
        stripeScript.src = 'https://js.stripe.com/v3/';
        document.head.appendChild(stripeScript);

        // Initialize Stripe with your publishable key
        let stripe;
        stripeScript.onload = () => {
            stripe = Stripe('pk_test_51OQofSHGgwl4L4aFBCBC75IHsfCXl4cV1yF3zFqpAdGJjprOTMVrgtawnBfSwzJOoePfshv1bdcnzFPyddaZl6bx00AHnVHXAJ'); // Replace with your publishable key
        };

        // Add to cart function
        function addToCart(product, selectedStock) {
            if (!selectedStock) {
                alert('Please select an item first');
                return;
            }
            
            const cart = JSON.parse(localStorage.getItem('cart') || '[]');
            const cartItem = {
                id: Date.now().toString(),
                title: product.title,
                price: product.price,
                stock: selectedStock
            };
            cart.push(cartItem);
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            alert('Product added to cart!');
        }

        // Handle buy button
        buyButton.onclick = async function() {
            const selectedPayment = document.querySelector('.payment-option.selected')?.dataset.method;
            const selectedStock = stockSelect.value;

            if (!selectedPayment) {
                alert('Please select a payment method');
                return;
            }

            if (!selectedStock) {
                alert('Please select an item');
                return;
            }

            // Generate order ID
            const orderId = 'st_' + Math.random().toString(36).substring(2, 8);
            
            try {
                // Create Stripe session
                const response = await fetch('/api/create-stripe-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        product_name: product.title,
                        price: product.price,
                        order_id: orderId,
                        customer_email: localStorage.getItem('customerEmail'),
                        item: selectedStock,
                        success_url: `${window.location.origin}/verify-payment.html?order_id=${orderId}`,
                        cancel_url: window.location.href
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const session = await response.json();
                
                // Save pending order
                const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders') || '[]');
                pendingOrders.push({
                    id: orderId,
                    product: product.title,
                    price: product.price,
                    stock: selectedStock,
                    timestamp: Date.now()
                });
                localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));

                // Redirect to Stripe checkout
                const result = await stripe.redirectToCheckout({
                    sessionId: session.id
                });

                if (result.error) {
                    throw result.error;
                }
            } catch (error) {
                console.error('Payment error:', error);
                alert('Payment failed: ' + error.message);
            }
        };
    } else {
        document.body.innerHTML = '<div class="error">Product not found</div>';
    }
}); 