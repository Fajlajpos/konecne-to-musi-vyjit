// ==========================================
// AUTHENTICATION SYSTEM
// ==========================================

// Storage keys
const USERS_KEY = 'oblivions_users';
const SESSION_KEY = 'oblivions_session';

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

// Get all users from localStorage
function getUsers() {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : [];
}

// Save users to localStorage
function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

// Get current session
function getSession() {
    const session = localStorage.getItem(SESSION_KEY);
    return session ? JSON.parse(session) : null;
}

// Save session
function saveSession(user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

// Clear session
function clearSession() {
    localStorage.removeItem(SESSION_KEY);
}

// Show message
function showMessage(elementId, message, isError = true) {
    const messageEl = document.getElementById(elementId);
    if (!messageEl) return;

    messageEl.textContent = message;
    messageEl.style.display = 'block';
    messageEl.className = isError ? 'auth-message error-message' : 'auth-message success-message';
}

// Hide message
function hideMessage(elementId) {
    const messageEl = document.getElementById(elementId);
    if (messageEl) {
        messageEl.style.display = 'none';
    }
}

// Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// ==========================================
// REGISTRATION PAGE
// ==========================================

if (window.location.pathname.includes('register.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('register-form');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');

        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const wrapper = button.closest('.password-input-wrapper');
                if (!wrapper) return;

                const input = wrapper.querySelector('input');
                if (!input) return;

                if (input.type === 'password') {
                    input.type = 'text';
                } else {
                    input.type = 'password';
                }
            });
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideMessage('error-message');
            hideMessage('success-message');

            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = passwordInput.value;
            const confirmPassword = confirmPasswordInput.value;

            // Validation
            if (!name || !email || !password || !confirmPassword) {
                showMessage('error-message', 'All fields are required');
                return;
            }

            if (!isValidEmail(email)) {
                showMessage('error-message', 'Invalid email format');
                return;
            }

            if (password.length < 8) {
                showMessage('error-message', 'Password must be at least 8 characters');
                return;
            }

            if (!/[A-Z]/.test(password)) {
                showMessage('error-message', 'Password must contain at least one uppercase letter');
                return;
            }

            if (!/[0-9]/.test(password)) {
                showMessage('error-message', 'Password must contain at least one number');
                return;
            }

            if (password !== confirmPassword) {
                showMessage('error-message', 'Passwords do not match');
                return;
            }

            try {
                const csrfRes = await fetch('/api/csrf-token');
                const csrfData = await csrfRes.json();
                const csrfToken = csrfData.csrfToken;

                const response = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'CSRF-Token': csrfToken
                    },
                    body: JSON.stringify({ name, email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    saveSession({ name: data.user.name, email: data.user.email, role: data.user.role });
                    showMessage('success-message', 'Registration successful! Redirecting...', false);
                    setTimeout(() => {
                        window.location.href = 'index.html?skipLanding=true';
                    }, 1500);
                } else {
                    showMessage('error-message', data.error || 'Registration failed');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showMessage('error-message', 'Network error occurred');
            }
        });
    });
}

// ==========================================
// LOGIN PAGE
// ==========================================

if (window.location.pathname.includes('login.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('login-form');
        const passwordInput = document.getElementById('password');

        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const wrapper = button.closest('.password-input-wrapper');
                if (!wrapper) return;

                const input = wrapper.querySelector('input');
                if (!input) return;

                if (input.type === 'password') {
                    input.type = 'text';
                } else {
                    input.type = 'password';
                }
            });
        });

        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideMessage('error-message');

            const email = document.getElementById('email').value.trim();
            const password = passwordInput.value;

            // Validation
            if (!email || !password) {
                showMessage('error-message', 'All fields are required');
                return;
            }

            if (!isValidEmail(email)) {
                showMessage('error-message', 'Invalid email format');
                return;
            }

            try {
                const csrfRes = await fetch('/api/csrf-token');
                const csrfData = await csrfRes.json();
                const csrfToken = csrfData.csrfToken;

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
                    saveSession({ name: data.name, email: email, role: data.role });
                    window.location.href = 'index.html?skipLanding=true';
                } else {
                    showMessage('error-message', data.error || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage('error-message', 'Network error occurred');
            }
        });
    });
}

// ==========================================
// MAIN PAGE - USER ICON & SESSION
// ==========================================

const currentPath = window.location.pathname;
const isMainPage = currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('index.html') || (!currentPath.includes('login.html') && !currentPath.includes('register.html'));

if (isMainPage) {
    document.addEventListener('DOMContentLoaded', () => {
        updateUserIcon();

        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async (e) => {
                e.preventDefault();

                try {
                    const csrfRes = await fetch('/api/csrf-token');
                    const csrfData = await csrfRes.json();
                    const csrfToken = csrfData.csrfToken;

                    await fetch('/api/auth/logout', {
                        method: 'POST',
                        headers: {
                            'CSRF-Token': csrfToken
                        }
                    });
                } catch (error) {
                    console.error('Logout error:', error);
                }

                clearSession();
                updateUserIcon();
                window.location.href = 'index.html?skipLanding=true#obleceni';
            });
        }
    });
}

// Update user icon based on session
function updateUserIcon() {
    const session = getSession();
    const userNameEl = document.getElementById('user-name');
    const loginLink = document.getElementById('login-link');
    const registerLink = document.getElementById('register-link');
    const logoutBtn = document.getElementById('logout-btn');
    const navContainer = document.querySelector('.nav-container');

    if (!userNameEl || !loginLink || !registerLink || !logoutBtn) return;

    if (session) {
        // User is logged in
        if (session.role === 'admin') {
            // Admin display WITHOUT emojis - just gold badge
            userNameEl.innerHTML = `${session.name} <span style="background: #ffd700; color: #000; padding: 0.2rem 0.5rem; border-radius: 3px; font-size: 0.7rem; margin-left: 0.5rem; font-weight: bold;">ADMIN</span>`;
            userNameEl.style.color = '#ffd700';
            userNameEl.style.fontWeight = 'bold';
            userNameEl.style.textShadow = '0 0 10px rgba(255, 215, 0, 0.5)';

            // Add database button OUTSIDE user-icon-container
            let dbButton = document.getElementById('admin-db-button');
            if (!dbButton && navContainer) {
                dbButton = document.createElement('a');
                dbButton.id = 'admin-db-button';
                dbButton.href = 'admin.html';
                dbButton.textContent = 'DATABÁZE';
                dbButton.className = 'nav-link';
                dbButton.style.cssText = 'color: #ffd700; font-weight: bold; text-decoration: none; margin-left: 1rem;';

                const cartContainer = document.querySelector('.cart-icon-container');
                if (cartContainer) {
                    navContainer.insertBefore(dbButton, cartContainer);
                }
            }
        } else {
            // Regular user
            userNameEl.textContent = session.name;
            userNameEl.style.color = '';
            userNameEl.style.fontWeight = '';
            userNameEl.style.textShadow = '';
            const dbButton = document.getElementById('admin-db-button');
            if (dbButton) dbButton.remove();
        }

        userNameEl.style.display = 'inline';
        loginLink.style.display = 'none';
        registerLink.style.display = 'none';
        logoutBtn.style.display = 'block';
    } else {
        // User is not logged in
        userNameEl.style.display = 'none';
        loginLink.style.display = 'block';
        registerLink.style.display = 'block';
        logoutBtn.style.display = 'none';

        const dbButton = document.getElementById('admin-db-button');
        if (dbButton) dbButton.remove();
    }
}

// Export for use in other scripts
window.authSystem = {
    getSession,
    updateUserIcon,
    clearSession
};
