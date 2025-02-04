async function verifyPayment(orderId) {
    try {
        // Check if it's a Stripe order
        if (orderId.startsWith('st_')) {
            console.log('Verifying Stripe payment for order:', orderId);
            
            const response = await fetch('/api/verify-stripe-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ order_id: orderId })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Verification response:', data);

            if (data.status === 'complete') {
                // Update local storage
                const pendingOrders = JSON.parse(localStorage.getItem('pendingOrders')) || [];
                const purchases = JSON.parse(localStorage.getItem('customerPurchases')) || [];
                
                const order = pendingOrders.find(o => o.id === orderId);
                if (order) {
                    purchases.push({
                        id: orderId,
                        product: order.product,
                        price: order.price,
                        paymentMethod: 'Card',
                        date: new Date().toLocaleDateString(),
                        delivered: true,
                        item: order.stock
                    });
                    
                    // Remove from pending orders
                    const updatedPendingOrders = pendingOrders.filter(o => o.id !== orderId);
                    
                    // Save changes
                    localStorage.setItem('customerPurchases', JSON.stringify(purchases));
                    localStorage.setItem('pendingOrders', JSON.stringify(updatedPendingOrders));

                    // Clear cart after successful purchase
                    localStorage.setItem('cart', '[]');
                    
                    // Show review prompt
                    setTimeout(() => {
                        if (confirm('Would you like to leave a review for ' + order.product + '?')) {
                            window.location.href = `reviews.html?product=${encodeURIComponent(order.product)}`;
                        }
                    }, 1000);
                }
                
                return true;
            }
            
            return false;
        }
        
        // ... rest of your payment verification code ...
    } catch (error) {
        console.error('Payment verification error:', error);
        return false;
    }
}