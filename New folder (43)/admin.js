document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const addProductBtn = document.getElementById('addProductBtn');
    const productForm = document.getElementById('productForm');
    const addProductForm = document.getElementById('addProductForm');
    const cancelBtn = document.getElementById('cancelBtn');
    const productsList = document.getElementById('productsList');

    // Debug check
    console.log('Elements found:', {
        addProductBtn,
        productForm,
        addProductForm,
        cancelBtn,
        productsList
    });

    // Get existing products from localStorage or use default
    function getProducts() {
        const storedProducts = localStorage.getItem('storeProducts'); // Make sure this key matches your main site
        console.log('Stored products:', storedProducts);
        
        if (storedProducts) {
            try {
                return JSON.parse(storedProducts);
            } catch (e) {
                console.error('Error parsing stored products:', e);
                return [];
            }
        }
        
        // Default products if none in storage
        return [
            {
                title: 'OTP Bot',
                price: 18.99,
                description: 'Automates One-Time Passwords for secure logins.',
                payment_methods: ['crypto', 'paypal'],
                category: 'software',
                stock: []
            },
            {
                title: 'SMS Bot',
                price: 24.99,
                description: 'Automated SMS messaging solution.',
                payment_methods: ['crypto', 'paypal', 'card'],
                category: 'software',
                stock: []
            }
        ];
    }

    let products = getProducts();
    console.log('Initial products:', products);

    // Save products to localStorage
    function saveProducts() {
        localStorage.setItem('storeProducts', JSON.stringify(products));
        console.log('Saved products:', products);
    }

    // Show form when Add Product button is clicked
    if (addProductBtn) {
        addProductBtn.onclick = function() {
            console.log('Add Product button clicked');
            if (productForm) {
                productForm.style.display = 'block';
                addProductForm.reset();
            }
        };
    }

    // Hide form when Cancel button is clicked
    if (cancelBtn) {
        cancelBtn.onclick = function() {
            if (productForm) {
                productForm.style.display = 'none';
            }
        };
    }

    // Handle form submission
    if (addProductForm) {
        addProductForm.onsubmit = function(e) {
            e.preventDefault();
            console.log('Form submitted');
            
            const formData = new FormData(addProductForm);
            const payment_methods = [];
            
            document.querySelectorAll('input[name="payment_methods"]:checked').forEach(checkbox => {
                payment_methods.push(checkbox.value);
            });
            
            const newProduct = {
                title: formData.get('title'),
                price: parseFloat(formData.get('price')),
                description: formData.get('description'),
                payment_methods: payment_methods,
                category: formData.get('category'),
                stock: []
            };

            console.log('New product:', newProduct);

            products.push(newProduct);
            saveProducts();
            
            productForm.style.display = 'none';
            addProductForm.reset();
            
            displayProducts();
        };
    }

    // Display products
    function displayProducts() {
        console.log('Displaying products:', products);
        if (productsList) {
            productsList.innerHTML = products.map((product, index) => `
                <div class="product-card">
                    <h3>${product.title}</h3>
                    <p class="description">${product.description}</p>
                    <div class="price-row">
                        <p class="price">$${product.price.toFixed(2)}</p>
                        <span class="stock-status">${product.stock.length} in stock</span>
                    </div>
                    <div class="stock-management">
                        <textarea class="stock-input" rows="3" placeholder="Add stock (one item per line)">${product.stock.join('\n')}</textarea>
                        <button class="save-stock-btn" onclick="saveStock(${index}, this)">
                            <i class="fas fa-save"></i> Save Stock
                        </button>
                    </div>
                    <div class="product-actions">
                        <button class="edit-btn" onclick="editProduct(${index})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="delete-btn" onclick="deleteProduct(${index})">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `).join('');
        }
    }

    // Save stock
    window.saveStock = function(index, button) {
        const stockTextarea = button.previousElementSibling;
        const stockItems = stockTextarea.value.split('\n').filter(item => item.trim() !== '');
        products[index].stock = stockItems;
        saveProducts();
        displayProducts();
    };

    // Delete product
    window.deleteProduct = function(index) {
        if (confirm('Are you sure you want to delete this product?')) {
            products.splice(index, 1);
            saveProducts();
            displayProducts();
        }
    };

    // Initial display
    displayProducts();

    // Add this at the top of your admin.js
    function logout() {
        localStorage.removeItem('adminLoggedIn');
        window.location.href = 'admin-login.html';
    }

    // Add a logout button to your admin panel HTML
    document.querySelector('.admin-sidebar').innerHTML += `
        <button onclick="logout()" class="logout-btn">
            <i class="fas fa-sign-out-alt"></i> Logout
        </button>
    `;
}); 