document.addEventListener('DOMContentLoaded', function() {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order_id');
    const paymentStatus = urlParams.get('status');
    
    console.log('URL Params:', { orderId, paymentStatus }); // Debug log
    
    if (orderId && paymentStatus === 'success') {
        // Get pending order
        const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders')) || [];
        const orderIndex = pendingOrders.findIndex(order => order.id === orderId);
        
        if (orderIndex !== -1) {
            const order = pendingOrders[orderIndex];
            
            // Verify payment
            verifyPayment(orderId).then(verified => {
                if (verified) {
                    // Remove from pending orders
                    pendingOrders.splice(orderIndex, 1);
                    localStorage.setItem('pendingOrders', JSON.stringify(pendingOrders));
                    
                    // Add to purchases
                    const purchases = JSON.parse(localStorage.getItem('customerPurchases')) || [];
                    purchases.push({
                        id: orderId,
                        product: order.product,
                        price: order.price,
                        paymentMethod: 'Card',
                        date: new Date().toLocaleDateString(),
                        delivered: true,
                        item: order.stock
                    });
                    localStorage.setItem('customerPurchases', JSON.stringify(purchases));
                    
                    // Update product stock
                    const products = JSON.parse(localStorage.getItem('storeProducts'));
                    const product = products.find(p => p.title === order.product);
                    if (product) {
                        product.stock = product.stock.filter(item => item !== order.stock);
                        localStorage.setItem('storeProducts', JSON.stringify(products));
                    }
                    
                    // Refresh the page to show the purchase
                    window.location.reload();
                }
            });
        }
    }
});

async function verifyPayment(orderId) {
    try {
        // Check if it's a Stripe order
        if (orderId.startsWith('st_')) {
            console.log('Verifying Stripe payment for order:', orderId);
            
            const response = await fetch('http://localhost:3000/verify-stripe-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ order_id: orderId })
            });
            
            if (!response.ok) {
                throw new Error('Failed to verify payment');
            }
            
            const data = await response.json();
            console.log('Stripe verification response:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }

            if (data.status === 'complete') {
                // Update the purchase status
                const purchases = JSON.parse(localStorage.getItem('customerPurchases')) || [];
                const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders')) || [];
                
                // Find the pending order
                const pendingOrder = pendingOrders.find(order => order.id === orderId);
                if (pendingOrder) {
                    // Send email to customer
                    const customerEmail = localStorage.getItem('customerEmail');
                    try {
                        const emailResponse = await fetch('http://localhost:8080/send-purchase-email', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                customerEmail: customerEmail,
                                product: pendingOrder.product,
                                orderId: orderId,
                                item: pendingOrder.stock
                            })
                        });

                        if (!emailResponse.ok) {
                            console.error('Failed to send email');
                        }
                    } catch (emailError) {
                        console.error('Error sending email:', emailError);
                    }

                    // Add to purchases
                    purchases.push({
                        id: orderId,
                        product: pendingOrder.product,
                        price: pendingOrder.price,
                        paymentMethod: 'Card',
                        date: new Date().toLocaleDateString(),
                        delivered: true,
                        item: pendingOrder.stock
                    });
                    
                    // Remove from pending orders
                    const updatedPendingOrders = pendingOrders.filter(order => order.id !== orderId);
                    
                    // Save changes
                    localStorage.setItem('customerPurchases', JSON.stringify(purchases));
                    localStorage.setItem('pendingOrders', JSON.stringify(updatedPendingOrders));
                }
            }
            
            return data.status === 'complete';
        }
        
        // Check if it's a PayPal order
        if (orderId.startsWith('pp')) {
            // For PayPal, we can verify using PayPal's API
            const verifyUrl = `https://api-m.paypal.com/v2/checkout/orders/${orderId}`;
            const response = await fetch(verifyUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Basic ' + btoa('YOUR_PAYPAL_CLIENT_ID:YOUR_PAYPAL_SECRET')
                }
            });
            
            if (!response.ok) {
                throw new Error(`PayPal verification failed: ${response.status}`);
            }
            
            const data = await response.json();
            return data.status === 'COMPLETED';
        }
        
        // Hood Pay verification
        if (orderId.startsWith('m')) {
            const verifyUrl = `https://pay.hood-pay.com/status/${orderId}`;
            console.log('Verifying payment at:', verifyUrl);

            const response = await fetch(verifyUrl, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer hoodpay_live_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjI1NzEyIiwiZXhwIjoyMDUzMzY2Mzk3fQ.6-34sS40s2yu_47iiEO3znnWZW_U5JOS5szFq1pcD2I'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Verification response:', data);
            
            return data.status === 'completed' || data.status === 'success';
        }
        
        return false;
    } catch (error) {
        console.error('Payment verification error:', error);
        return false;
    }
} 