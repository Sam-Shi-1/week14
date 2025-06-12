// Sam

// Database simulation
let users = JSON.parse(localStorage.getItem('users')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let cart = JSON.parse(localStorage.getItem('cart')) || {};
let orders = JSON.parse(localStorage.getItem('orders')) || {};
let sessionUser = JSON.parse(sessionStorage.getItem('currentUser')) || null;

// Products data
async function loadProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) {
            throw new Error('Failed to load products');
        }
        return await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        return []; // Return empty array if loading fails
    }
}

// Update the initialization
document.addEventListener('DOMContentLoaded', async function() {
    // Load products first
    products = await loadProducts();
    
    updateUserDisplay();
    
    // Page-specific initializations
    if (window.location.pathname.includes('cart.html')) {
        initCartPage();
    } else if (window.location.pathname.includes('confirm.html')) {
        initConfirmPage();
    } else if (window.location.pathname.includes('logout.html')) {
        initLogoutPage();
    } else if (window.location.pathname.includes('orders.html')) {
        initOrdersPage();
    }
});

// Make products a global variable
let products = [];

// User authentication functions
function register() {
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value; 
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!username || !email || !password || !confirmPassword) {
        document.getElementById('register-error').textContent = 'Please fill all fields';
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        document.getElementById('register-error').textContent = 'Invalid email format';
        return;
    }

    if (password !== confirmPassword) {
        document.getElementById('register-error').textContent = 'Passwords do not match';
        return;
    }

    if (users.some(user => user.username === username)) {
        document.getElementById('register-error').textContent = 'Username already exists';
        return;
    }

    // Add the new user to the users array and save to localStorage
    users.push({ username, email, password });
    localStorage.setItem('users', JSON.stringify(users));

    // Clear any previous error message
    document.getElementById('register-error').textContent = '';

    // Show a success message and redirect to the login page
    alert('Registration successful! Please login.');
    window.location.href = 'login.html'; // Redirect to the login page
}
function login() {
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const rememberMe = document.getElementById('remember-me')?.checked;
    
    const user = users.find(user => user.username === username && user.password === password);
    
    if (user) {
        currentUser = { username }; 
        sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        if(rememberMe) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            localStorage.removeItem('currentUser');
        }
        
        updateUserDisplay();
        document.getElementById('login-error').textContent = '';
        alert('Login successful!');
        window.location.href = 'cart.html';
    } else {
        document.getElementById('login-error').textContent = 'Invalid username or password';
    }
}

function logout() {
    if (currentUser) {
        const username = currentUser.username;

        // Clear cart for current user
        delete cart[username];
        localStorage.setItem('cart', JSON.stringify(cart));
        if (Object.keys(cart).length === 0) {
            localStorage.removeItem('cart');
        }

        // Clear orders for current user
        delete orders[username];
        localStorage.setItem('orders', JSON.stringify(orders));
        if (Object.keys(orders).length === 0) {
            localStorage.removeItem('orders');
        }

        // Clear registeredCourses for current user
        localStorage.removeItem('registeredCourses');
    }

    currentUser = null;
    sessionStorage.removeItem('currentUser'); 
    localStorage.removeItem('currentUser'); 
    sessionStorage.removeItem('cart'); 
    updateUserDisplay();
}

function updateUserDisplay() {
    const usernameDisplays = document.querySelectorAll('#username-display');
    const logoutLinks = document.querySelectorAll('#logout-link');
    
    let user = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!user) {
        user = JSON.parse(localStorage.getItem('currentUser'));
    }
    
    if (user) {
        currentUser = user; 
        usernameDisplays.forEach(el => el.textContent = user.username);
        logoutLinks.forEach(el => el.style.display = 'inline');
    } else {
        currentUser = null;
        usernameDisplays.forEach(el => el.textContent = 'Guest');
        logoutLinks.forEach(el => el.style.display = 'none');
    }
}



// Cart functions
async function initCartPage() {
    if (!currentUser) {
        document.getElementById('login-prompt').style.display = 'block';
        document.getElementById('cart-content').style.display = 'none';
        return;
    }
    
    document.getElementById('login-prompt').style.display = 'none';
    document.getElementById('cart-content').style.display = 'block';

    // Ensure cart is initialized if it doesn't exist
    const userId = currentUser.username;
    if (!cart[userId]) {
        cart[userId] = [];
        localStorage.setItem('cart', JSON.stringify(cart)); // Save the initialized cart to local storage
    }
    
    await displayProducts(); 
    displayCartItems();
}

async function displayProducts() {
    if (products.length === 0) {
        products = await loadProducts(); 
    }
    
    const productList = document.getElementById('product-list');
    productList.innerHTML = '';
    
    products.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p>$${product.price.toFixed(2)}</p>
            <div>
                <label for="quantity-${product.id}">number：</label>
                <input type="number" id="quantity-${product.id}" min="1" value="1">
                <button onclick="addToCart(${product.id})">add to cart</button>
            </div>
        `;
        productList.appendChild(productCard);
    });
}

function addToCart(productId) {
    if (!currentUser) {
        alert('Please login to add items to cart');
        return;
    }
    
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const userId = currentUser.username;
    if (!cart[userId]) {
        cart[userId] = [];
    }

    const quantityInput = document.getElementById(`quantity-${productId}`);
    const quantity = parseInt(quantityInput.value, 10);
    if (isNaN(quantity) || quantity < 1) {
        alert('Please enter a valid quantity');
        return;
    }

    const existingItem = cart[userId].find(item => item.id === productId);
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart[userId].push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: quantity
        });
    }

    // Save cart to local storage
    localStorage.setItem('cart', JSON.stringify(cart));

    // If cart was empty before, ensure it is now saved
    if (cart[userId].length > 0) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    displayCartItems();
}

function displayCartItems() {
    if (!currentUser) return;

    const userId = currentUser.username;
    const cartItemsContainer = document.getElementById('cart-summary-items');
    cartItemsContainer.innerHTML = '';

    if (!cart[userId] || cart[userId].length === 0) {
        cartItemsContainer.innerHTML = '<p>Your cart is empty</p>';
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.disabled = true;
        }

        // Remove cart from local storage if empty
        delete cart[userId];
        localStorage.setItem('cart', JSON.stringify(cart));
        if (Object.keys(cart).length === 0) {
            localStorage.removeItem('cart');
        }

        return;
    }

    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.disabled = false;
    }

    let total = 0;
    cart[userId].forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;

        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>Price: $${item.price.toFixed(2)}</p>
            <div>
                <label for="cart-quantity-${item.id}">Quantity:</label>
                <input type="number" id="cart-quantity-${item.id}" min="1" value="${item.quantity}" onchange="updateCartItemQuantity(${item.id})">
            </div>
            <p>Subtotal: $${itemTotal.toFixed(2)}</p>
            <button onclick="removeFromCart(${item.id})">Remove</button>
            <button onclick="increaseQuantity(${item.id})">+</button>
            <button onclick="decreaseQuantity(${item.id})">-</button>
        `;
        cartItemsContainer.appendChild(cartItem);
    });

    const totalElement = document.createElement('div');
    totalElement.className = 'cart-total';
    totalElement.innerHTML = `<h3>Total: $${total.toFixed(2)}</h3>`;
    cartItemsContainer.appendChild(totalElement);
}

function removeFromCart(productId) {
    if (!currentUser) return;
    
    const userId = currentUser.username;
    if (!cart[userId]) return;
    
    cart[userId] = cart[userId].filter(item => item.id !== productId);

    // Save cart to local storage
    localStorage.setItem('cart', JSON.stringify(cart));

    // If cart is now empty, remove it from local storage
    if (cart[userId].length === 0) {
        delete cart[userId];
        localStorage.setItem('cart', JSON.stringify(cart));
        if (Object.keys(cart).length === 0) {
            localStorage.removeItem('cart');
        }
    }

    displayCartItems();
}

function updateCartItemQuantity(productId) {
    if (!currentUser) return;

    const userId = currentUser.username;
    const quantityInput = document.getElementById(`cart-quantity-${productId}`);
    const newQuantity = parseInt(quantityInput.value, 10);

    if (isNaN(newQuantity) || newQuantity < 1) {
        alert('Please enter a valid quantity');
        quantityInput.value = cart[userId].find(item => item.id === productId).quantity; 
        return;
    }

    cart[userId] = cart[userId].map(item => {
        if (item.id === productId) {
            item.quantity = newQuantity;
        }
        return item;
    });

    // Save cart to local storage
    localStorage.setItem('cart', JSON.stringify(cart));

    displayCartItems();
}

function proceedToCheckout() {
    if (!currentUser) return;
    
    window.location.href = 'confirm.html';
}

// Order confirmation functions
function initConfirmPage() {
    if (!currentUser) {
        document.getElementById('login-prompt').style.display = 'block';
        document.getElementById('order-content').style.display = 'none';
        return;
    }
    
    document.getElementById('login-prompt').style.display = 'none';
    document.getElementById('order-content').style.display = 'block';
    
    displayOrderSummary();
}

function displayOrderSummary() {
    if (!currentUser) return;
    
    const userId = currentUser.username;
    const orderSummary = document.getElementById('order-summary');
    orderSummary.innerHTML = '<h2>Order Summary</h2>';
    
    if (!cart[userId] || cart[userId].length === 0) {
        orderSummary.innerHTML += '<p>Your cart is empty</p>';
        return;
    }
    
    let total = 0;
    cart[userId].forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        orderSummary.innerHTML += `
            <div class="order-item">
                <h3>${item.name}</h3>
                <p>Price: $${item.price.toFixed(2)} x ${item.quantity} = $${itemTotal.toFixed(2)}</p>
            </div>
        `;
    });
    
    orderSummary.innerHTML += `<h3>Total: $${total.toFixed(2)}</h3>`;
}

function confirmOrder() {
    if (!currentUser) return;

    const userId = currentUser.username;
    if (!cart[userId] || cart[userId].length === 0) {
        alert('Your cart is empty');
        return;
    }

    // Create order
    const orderId = Date.now();
    if (!orders[userId]) {
        orders[userId] = [];
    }

    let total = 0;
    const orderItems = cart[userId].map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return {
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image 
        };
    });

    orders[userId].push({
        id: orderId,
        date: new Date().toISOString(),
        items: orderItems,
        total: total
    });

    localStorage.setItem('orders', JSON.stringify(orders));

    // Clear cart and remove cart from local storage
    delete cart[userId];
    localStorage.setItem('cart', JSON.stringify(cart)); // Ensure cart is updated in local storage
    if (Object.keys(cart).length === 0) {
        localStorage.removeItem('cart'); // Remove the cart key entirely
    }

    alert('Order confirmed! Thank you for your purchase.');
    window.location.href = 'orders.html'; // Redirect to orders management page
}

function initOrdersPage() {
    if (!currentUser) {
        const loginPrompt = document.getElementById('login-prompt');
        const ordersContent = document.getElementById('orders-content');
        if (loginPrompt && ordersContent) {
            loginPrompt.style.display = 'block';
            ordersContent.style.display = 'none';
        } else {
            console.error('Required elements not found');
        }
        return;
    }

    const loginPrompt = document.getElementById('login-prompt');
    const ordersContent = document.getElementById('orders-content');
    if (loginPrompt && ordersContent) {
        loginPrompt.style.display = 'none';
        ordersContent.style.display = 'block';
        displayOrders();
    } else {
        console.error('Required elements not found');
    }
}

function editOrder() {
    window.location.href = 'cart.html'; 
}

// Display orders function
function displayOrders() {
    if (!currentUser) return;

    const userId = currentUser.username;
    const ordersList = document.getElementById('orders-list');
    ordersList.innerHTML = '<h2>Your Orders</h2>';

    const storedOrders = JSON.parse(localStorage.getItem('orders')) || {};
    const userOrders = storedOrders[userId] || [];

    if (userOrders.length === 0) {
        ordersList.innerHTML += '<p>No orders yet.</p>';
        return;
    }

    userOrders.forEach(order => {
        const orderElement = document.createElement('div');
        orderElement.className = 'order';
        orderElement.innerHTML = `
            <h3>Order ID: ${order.id}</h3>
            <p>Date: ${new Date(order.date).toLocaleString()}</p>
            <h4>Items:</h4>
            <ul>
                ${order.items.map(item => `
                    <li class="order-item">
                        <img src="${item.image}" alt="${item.name}" class="order-item-image">
                        <span>${item.name} x ${item.quantity} - $${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                `).join('')}
            </ul>
            <p>Total: $${order.total.toFixed(2)}</p>
            <button onclick="downloadOrder(${order.id})" class="orders-list button">Download Order</button>
            <button onclick="deleteOrder(${order.id})" class="orders-list button">Delete Order</button>
        `;
        ordersList.appendChild(orderElement);
    });
}

function downloadOrder(orderId) {
    if (!currentUser) return;

    const userId = currentUser.username;
    if (!orders[userId]) return;

    const order = orders[userId].find(order => order.id === orderId);
    if (!order) return;

    const orderJSON = JSON.stringify(order, null, 2);

    const blob = new Blob([orderJSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `order_${order.id}.json`; 
    document.body.appendChild(a);
    a.click();

    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Delete order function
function deleteOrder(orderId) {
    if (!currentUser) return;

    const userId = currentUser.username;
    if (!orders[userId]) return;

    const updatedOrders = orders[userId].filter(order => order.id !== orderId);
    orders[userId] = updatedOrders;

    // Save updated orders to local storage
    if (orders[userId].length === 0) {
        delete orders[userId];
        if (Object.keys(orders).length === 0) {
            localStorage.removeItem('orders'); // Remove the key if no orders
        } else {
            localStorage.setItem('orders', JSON.stringify(orders));
        }
    } else {
        localStorage.setItem('orders', JSON.stringify(orders));
    }

    displayOrders();
}

// Logout functions
function initLogoutPage() {
    if (currentUser) {
        // Clear cart for current user
        const userId = currentUser.username;
        if (cart[userId]) {
            // Save order before clearing
            if (orders[userId] && orders[userId].length > 0) {
                const lastOrder = orders[userId][orders[userId].length - 1];
                downloadOrder(lastOrder.id);
            }
            
            delete cart[userId];
            localStorage.setItem('cart', JSON.stringify(cart));
        }
        
        // Logout
        logout();
    }
}


// Existing code...

// Function to toggle cart sidebar
// Existing code...

// Function to toggle cart sidebar
function toggleCartSidebar() {
    const cartSidebar = document.getElementById('cart-sidebar');
    cartSidebar.classList.toggle('active');
    if (cartSidebar.classList.contains('active')) {
        if (currentUser) {
            displayCartItems();
        } else {
            alert('Please login to view your cart');
        }
    }
}

// Ensure cart items are displayed when sidebar is toggled
document.getElementById('floating-cart-btn').addEventListener('click', () => {
    if (currentUser) {
        displayCartItems();
    } else {
        alert('Please login to view your cart');
    }
});

// Increase item quantity
function increaseQuantity(productId) {
    if (!currentUser) return;

    const userId = currentUser.username;
    const item = cart[userId].find(item => item.id === productId);
    if (item) {
        item.quantity += 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
    }
}

// Decrease item quantity
function decreaseQuantity(productId) {
    if (!currentUser) return;

    const userId = currentUser.username;
    const item = cart[userId].find(item => item.id === productId);
    if (item && item.quantity > 1) {
        item.quantity -= 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        displayCartItems();
    }
}



function updateRegistrationStatus(courseId, isRegistered) {
    const registeredCourses = JSON.parse(localStorage.getItem('registeredCourses')) || {};
    if (isRegistered) {
        registeredCourses[courseId] = true;
    } else {
        delete registeredCourses[courseId];
    }

    // Save updated registeredCourses to local storage
    if (Object.keys(registeredCourses).length === 0) {
        localStorage.removeItem('registeredCourses'); // Remove the key if no courses are registered
    } else {
        localStorage.setItem('registeredCourses', JSON.stringify(registeredCourses));
    }
}

function isCourseRegistered(courseId) {
    const registeredCourses = JSON.parse(localStorage.getItem('registeredCourses')) || {};
    return registeredCourses[courseId] === true;
}

document.addEventListener('DOMContentLoaded', function() {
    const registerBtn = document.getElementById('register-btn');
    if (!registerBtn) {
        console.error('Register button not found');
        return;
    }

    const courseId = 'course1'; 
    const registeredCourses = JSON.parse(localStorage.getItem('registeredCourses')) || {};
    const isRegistered = registeredCourses[courseId] === true;

    function updateButtonState() {
        const user = JSON.parse(sessionStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            registerBtn.textContent = 'Login to Register';
            registerBtn.disabled = true;
        } else if (isRegistered) {
            registerBtn.textContent = 'Unregister';
        } else {
            registerBtn.textContent = 'Register';
        }
    }

    updateButtonState();

    registerBtn.addEventListener('click', () => {
        const user = JSON.parse(sessionStorage.getItem('currentUser')) || JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
            alert('Please login to register.');
            return;
        }

        if (isRegistered) {
            const confirmUnregister = confirm('Are you sure you want to unregister from this course?');
            if (confirmUnregister) {
                delete registeredCourses[courseId];
                if (Object.keys(registeredCourses).length === 0) {
                    localStorage.removeItem('registeredCourses');
                } else {
                    localStorage.setItem('registeredCourses', JSON.stringify(registeredCourses));
                }
                alert('You have unregistered from this course.');
                location.reload();
            }
        } else {
            registeredCourses[courseId] = true;
            localStorage.setItem('registeredCourses', JSON.stringify(registeredCourses));
            alert('Registration successful!');
            location.reload();
        }
    });
});


async function loadCourses() {
    try {
        const response = await fetch('courses.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const courses = await response.json();
        displayCourses(courses);
    } catch (error) {
        console.error('Error loading courses:', error);
        if (error instanceof SyntaxError) {
            console.error('Invalid JSON format:', error.message);
        }
    }
}


