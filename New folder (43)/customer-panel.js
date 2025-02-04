document.addEventListener('DOMContentLoaded', function() {
    const purchasesList = document.getElementById('purchasesList');
    
    // Get purchases from localStorage
    const purchases = JSON.parse(localStorage.getItem('customerPurchases')) || [];
    
    // Display purchases
    if (purchases.length > 0) {
        purchasesList.innerHTML = purchases.map(purchase => `
            <div class="purchase-card">
                <div class="purchase-header">
                    <h3 class="purchase-title">${purchase.product}</h3>
                    <span class="purchase-date">${purchase.date}</span>
                </div>
                <div class="purchase-info">
                    <p>Order ID: #${purchase.id}</p>
                    <p>Payment Method: ${purchase.paymentMethod}</p>
                    <p>Price: $${purchase.price}</p>
                </div>
                ${purchase.delivered ? `
                    <div class="purchase-details">
                        ${purchase.item}
                    </div>
                ` : `
                    <div class="purchase-pending">
                        Your item will appear here once payment is confirmed
                    </div>
                `}
                <div class="delivery-status ${purchase.delivered ? 'delivered' : 'pending'}">
                    <i class="fas ${purchase.delivered ? 'fa-check-circle' : 'fa-clock'}"></i>
                    ${purchase.delivered ? 'Delivered' : 'Processing Payment'}
                </div>
            </div>
        `).join('');
    } else {
        purchasesList.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                <h3>No purchases yet</h3>
                <p>Visit our <a href="index.html#products">products page</a> to get started!</p>
            </div>
        `;
    }
}); 