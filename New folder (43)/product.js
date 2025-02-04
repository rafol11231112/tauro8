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

        // Handle buy button
        buyButton.onclick = async function() {
            const selectedPayment = document.querySelector('.payment-option.selected').dataset.method;
            const selectedStock = product.stock[0];
            
            // Handle Stripe (card) payment
            if (selectedPayment === 'card') {
                try {
                    // First check if item is selected
                    if (!stockSelect.value) {
                        alert('Please select an item first');
                        return;
                    }

                    // Generate order ID
                    const orderId = 'st_' + Math.random().toString(36).substring(2, 8);
                    
                    console.log('Creating Stripe session...'); // Debug log

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
                            success_url: window.location.origin + `/customer-panel.html?order_id=${orderId}&status=success`,
                            cancel_url: window.location.href
                        })
                    });

                    console.log('Response:', response); // Debug log

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const session = await response.json();
                    console.log('Session:', session); // Debug log

                    if (!session.id) {
                        throw new Error('Invalid session response');
                    }

                    // Save pending order
                    const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders')) || [];
                    pendingOrders.push({
                        id: orderId,
                        product: product.title,
                        price: product.price,
                        stock: selectedStock,
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
                    console.error('Payment error:', error);
                    alert('Payment failed: ' + error.message);
                }
                return;
            }
            
            // Handle PayPal
            if (selectedPayment === 'paypal') {
                // Generate order ID
                const orderId = 'pp' + Math.random().toString(36).substring(2, 8);
                
                // Save pending order
                const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders')) || [];
                pendingOrders.push({
                    id: orderId,
                    product: product.title,
                    price: product.price,
                    stock: selectedStock,
                    timestamp: Date.now()
                });
                localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));

                // Create PayPal payment URL
                const paypalUrl = `https://www.paypal.com/cgi-bin/webscr?` +
                    `cmd=_xclick` +
                    `&business=eyalcodes2007@gmail.com` + // Your PayPal email
                    `&item_name=${encodeURIComponent(product.title)}` +
                    `&amount=${product.price.toFixed(2)}` +
                    `&currency_code=USD` +
                    `&invoice=${orderId}` +
                    `&return=${encodeURIComponent(`${window.location.origin}/customer-panel.html?order_id=${orderId}&status=success`)}` +
                    `&cancel_return=${encodeURIComponent(window.location.href)}`;
                
                // Redirect to PayPal
                window.location.href = paypalUrl;
                return;
            }
            
            // Handle Hood Pay
            if (selectedPayment === 'hood') {
                // Generate a more Hood Pay-like order ID format
                const orderId = 'm' + Math.random().toString(36).substring(2, 8);
                
                // Save pending order BEFORE redirecting
                const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders')) || [];
                pendingOrders.push({
                    id: orderId,
                    product: product.title,
                    price: product.price,
                    stock: selectedStock,
                    timestamp: Date.now()
                });
                localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));

                // Create Hood Pay payment URL with exact format from your screenshot
                const hoodPayUrl = `https://pay.hood-pay.com/pay?amount=${product.price.toFixed(2)}&currency=USD&order_id=${orderId}&product_name=asdasdasd&success_url=${encodeURIComponent(`${window.location.origin}/customer-panel.html`)}&merchant_id=23750`;
                
                console.log('Hood Pay URL:', hoodPayUrl);
                
                // Redirect to Hood Pay
                window.location.href = hoodPayUrl;
                return;
            }
            
            // Remove selected stock item
            product.stock.splice(0, 1);
            
            // Save updated products
            localStorage.setItem('storeProducts', JSON.stringify(products));
            
            // Get customer email
            const customerEmail = localStorage.getItem('customerEmail');
            if (!customerEmail) {
                alert('Please login first!');
                window.location.href = 'customer-login.html';
                return;
            }
            
            // Save purchase to customer purchases
            const purchases = JSON.parse(localStorage.getItem('customerPurchases')) || [];
            const purchaseId = Date.now().toString(36) + Math.random().toString(36).substr(2);
            
            const purchaseData = {
                id: purchaseId,
                product: product.title,
                price: product.price,
                paymentMethod: selectedPayment,
                date: new Date().toLocaleDateString(),
                delivered: false,
                item: selectedStock
            };
            
            purchases.push(purchaseData);
            localStorage.setItem('customerPurchases', JSON.stringify(purchases));
            
            // Send email to customer
            try {
                console.log('Sending email to:', customerEmail);
                
                const response = await fetch('/api/send-purchase-email', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        customerEmail: customerEmail,
                        product: product.title,
                        orderId: purchaseId,
                        item: selectedStock
                    })
                });
                
                const emailResult = await response.json();
                if (!emailResult.success) {
                    console.error('Failed to send email:', emailResult.message);
                }
                
                // Continue with purchase process regardless of email status
                alert('Purchase successful! Check your customer panel for your item.');
                window.location.href = 'customer-panel.html';
                
            } catch (error) {
                console.error('Error:', error);
                // Continue with purchase process
                alert('Purchase successful! Check your customer panel for your item.');
                window.location.href = 'customer-panel.html';
            }
        };
    } else {
        document.body.innerHTML = '<div class="error">Product not found</div>';
    }
}); 