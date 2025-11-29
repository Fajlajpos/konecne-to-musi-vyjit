// Admin Panel Logic

// State
let csrfToken = '';

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    await fetchCsrfToken();
    checkSession();

    // Event Listeners
    document.getElementById('admin-login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);
});

async function fetchCsrfToken() {
    try {
        const response = await fetch('/api/csrf-token');
        const data = await response.json();
        csrfToken = data.csrfToken;
        document.getElementById('csrf-token').value = csrfToken;
    } catch (error) {
        console.error('Error fetching CSRF token:', error);
    }
}

async function checkSession() {
    // Try to fetch users to check if logged in
    try {
        const response = await fetch('/api/admin/users');
        if (response.ok) {
            showDashboard();
        } else {
            showLogin();
        }
    } catch (error) {
        showLogin();
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const password = document.getElementById('admin-password').value;
    const errorDiv = document.getElementById('login-error');

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'CSRF-Token': csrfToken
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            showDashboard();
        } else {
            errorDiv.textContent = data.error || 'Login failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'Network error';
        errorDiv.style.display = 'block';
    }
}

async function handleLogout() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'CSRF-Token': csrfToken
            }
        });
        showLogin();
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

function showLogin() {
    document.getElementById('admin-login-view').style.display = 'block';
    document.getElementById('admin-dashboard-view').style.display = 'none';
}

function showDashboard() {
    document.getElementById('admin-login-view').style.display = 'none';
    document.getElementById('admin-dashboard-view').style.display = 'block';
    loadUsers();
    loadOrders();
}

// Tab Switching
window.switchTab = function (tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    document.getElementById('tab-users').style.display = tabName === 'users' ? 'block' : 'none';
    document.getElementById('tab-orders').style.display = tabName === 'orders' ? 'block' : 'none';
}

// Data Loading
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        users.forEach(user => {
            const tr = document.createElement('tr');

            // Highlight admin rows
            if (user.role === 'admin') {
                tr.style.backgroundColor = 'rgba(255, 215, 0, 0.1)'; // Gold tint
            }

            tr.innerHTML = `
                <td>${escapeHtml(user.id)}</td>
                <td>${escapeHtml(user.name || '-')}</td>
                <td>${escapeHtml(user.email)}</td>
                <td>${user.role === 'admin' ? '<span class="status-badge" style="background: #ffd700; color: #000;">ADMIN</span>' : '<span class="status-badge status-pending">USER</span>'}</td>
                <td>${new Date(user.created_at).toLocaleDateString()}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadOrders() {
    try {
        const response = await fetch('/api/admin/orders');
        const orders = await response.json();
        const tbody = document.getElementById('orders-table-body');
        tbody.innerHTML = '';

        orders.forEach(order => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${escapeHtml(order.id)}</td>
                <td>${escapeHtml(order.customer_name || 'Guest')}</td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td>${escapeHtml(order.total_price)} Kč</td>
                <td><span class="status-badge status-${order.status.toLowerCase()}">${escapeHtml(order.status)}</span></td>
                <td><button onclick="viewOrder(${order.id})" class="auth-button" style="padding: 0.25rem 0.5rem; font-size: 0.8rem; width: auto;">VIEW</button></td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

// Order Modal
window.viewOrder = async function (orderId) {
    const modal = document.getElementById('order-modal');
    const content = document.getElementById('modal-content-body');
    document.getElementById('modal-order-id').textContent = orderId;

    content.innerHTML = 'Loading...';
    modal.style.display = 'flex';

    try {
        // Fetch items
        const itemsRes = await fetch(`/api/admin/orders/${orderId}/items`);
        const items = await itemsRes.json();

        // Fetch order details (we already have them in the list, but for simplicity let's re-fetch or find from DOM. 
        // Actually, let's just fetch the order list again or find it. For now, let's assume we want to show items.)

        let html = '<h3>Products</h3><table class="data-table"><thead><tr><th>Product</th><th>Qty</th><th>Price</th></tr></thead><tbody>';
        items.forEach(item => {
            html += `<tr>
                <td>${escapeHtml(item.product_name)}</td>
                <td>${escapeHtml(item.quantity)}</td>
                <td>${escapeHtml(item.price)} Kč</td>
            </tr>`;
        });
        html += '</tbody></table>';

        // Add address info (would need to fetch specific order detail endpoint if not passed, but for now we just show items)
        // To show address, we should have fetched it. Let's improve this later if needed.

        content.innerHTML = html;

    } catch (error) {
        content.textContent = 'Error loading details';
    }
}

window.closeModal = function () {
    document.getElementById('order-modal').style.display = 'none';
}

// XSS Protection Helper
function escapeHtml(unsafe) {
    if (unsafe === null || unsafe === undefined) return '';
    return String(unsafe)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
