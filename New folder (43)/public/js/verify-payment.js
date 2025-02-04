async function verifyPayment(orderId) {
    try {
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
            }
            
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Payment verification error:', error);
        return false;
    }
} 