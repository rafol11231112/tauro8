document.addEventListener('DOMContentLoaded', function() {
    const reviewsList = document.getElementById('reviewsList');
    const addReviewForm = document.getElementById('addReviewForm');
    const stars = document.querySelectorAll('.stars i');
    const ratingInput = document.getElementById('ratingInput');
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('customerLoggedIn') === 'true';
    const customerEmail = localStorage.getItem('customerEmail');
    
    if (!isLoggedIn) {
        document.getElementById('reviewForm').innerHTML = `
            <h2>Please <a href="customer-login.html">login</a> to write a review</h2>
        `;
    }
    
    // Check for product parameter
    const urlParams = new URLSearchParams(window.location.search);
    const productName = urlParams.get('product');
    
    if (productName) {
        const reviewTextarea = document.querySelector('textarea[name="review"]');
        if (reviewTextarea) {
            reviewTextarea.value = `Review for ${productName}: `;
        }
    }
    
    // Handle star rating
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = this.dataset.rating;
            updateStars(rating);
        });
        
        star.addEventListener('click', function() {
            const rating = this.dataset.rating;
            ratingInput.value = rating;
            updateStars(rating);
        });
    });
    
    document.querySelector('.stars').addEventListener('mouseout', function() {
        updateStars(ratingInput.value);
    });
    
    function updateStars(rating) {
        stars.forEach(star => {
            const starRating = star.dataset.rating;
            if (starRating <= rating) {
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('fas');
                star.classList.add('far');
            }
        });
    }
    
    // Handle review submission
    addReviewForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const review = {
            rating: ratingInput.value,
            text: e.target.review.value,
            email: customerEmail,
            date: new Date().toISOString(),
            verified: true
        };
        
        // Save review
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        reviews.push(review);
        localStorage.setItem('reviews', JSON.stringify(reviews));
        
        // Reset form
        e.target.reset();
        ratingInput.value = '';
        updateStars(0);
        
        // Refresh reviews
        displayReviews();
        
        alert('Thank you for your review!');
    });
    
    function displayReviews() {
        const reviews = JSON.parse(localStorage.getItem('reviews') || '[]');
        
        if (reviews.length === 0) {
            reviewsList.innerHTML = '<p class="no-reviews">No reviews yet. Be the first to write one!</p>';
            return;
        }
        
        reviewsList.innerHTML = reviews.sort((a, b) => new Date(b.date) - new Date(a.date))
            .map(review => `
                <div class="review-card">
                    <div class="review-header">
                        <div class="stars">
                            ${Array(5).fill('').map((_, i) => `
                                <i class="${i < review.rating ? 'fas' : 'far'} fa-star"></i>
                            `).join('')}
                        </div>
                        <span class="review-date">${new Date(review.date).toLocaleDateString()}</span>
                    </div>
                    <div class="review-content">
                        <p>${review.text}</p>
                    </div>
                    <div class="review-footer">
                        <span class="reviewer">${review.email}</span>
                        ${review.verified ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified Purchase</span>' : ''}
                    </div>
                </div>
            `).join('');
    }
    
    // Initial display
    displayReviews();
}); 