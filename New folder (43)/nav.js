window.updateCartCount = function() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    // Update user menu
    const customerEmail = localStorage.getItem('customerEmail');
    const isLoggedIn = localStorage.getItem('customerLoggedIn') === 'true';
    const userMenu = document.querySelector('.user-menu');
    const emailSpan = document.querySelector('.customer-email');
    const adminLink = document.querySelector('.admin-link');

    if (isLoggedIn && customerEmail) {
        emailSpan.textContent = customerEmail;
        adminLink.style.display = 'none';
    } else {
        emailSpan.innerHTML = '<a href="customer-login.html">Login</a>';
        adminLink.style.display = 'none';
    }
}); 