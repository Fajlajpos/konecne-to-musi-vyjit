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

// Generate unique ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

// Check password strength
function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = '';

    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) {
        feedback = 'Weak';
        return { strength: 25, color: '#ff6b6b', text: feedback };
    } else if (strength <= 4) {
        feedback = 'Medium';
        return { strength: 50, color: '#ffa500', text: feedback };
    } else if (strength <= 5) {
        feedback = 'Good';
        return { strength: 75, color: '#90ee90', text: feedback };
    } else {
        feedback = 'Excellent';
        return { strength: 100, color: '#6bff6b', text: feedback };
    }
}

// ==========================================
// REGISTRATION PAGE
// ==========================================

if (window.location.pathname.includes('register.html')) {
    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('register-form');
        const passwordInput = document.getElementById('password');
        const confirmPasswordInput = document.getElementById('confirm-password');
        const strengthFill = document.getElementById('strength-fill');
        const strengthText = document.getElementById('strength-text');

        // Password strength meter
        if (passwordInput && strengthFill && strengthText) {
            passwordInput.addEventListener('input', (e) => {
                const password = e.target.value;
                if (password.length === 0) {
                    strengthFill.style.width = '0';
                    strengthText.textContent = '';
                    return;
                }

                const result = checkPasswordStrength(password);
                strengthFill.style.width = result.strength + '%';
                strengthFill.style.backgroundColor = result.color;
                strengthText.textContent = result.text;
                strengthText.style.color = result.color;
            });
        }

        // Toggle password visibility
        document.querySelectorAll('.toggle-password').forEach(button => {
            button.addEventListener('click', () => {
                const wrapper = button.closest('.password-input-wrapper');
                const input = wrapper.querySelector('input');
                const eyeIcon = button.querySelector('.eye-icon');
                const eyeOffIcon = button.querySelector('.eye-off-icon');

                if (input.type === 'password') {
                    input.type = 'text';
                    eyeIcon.style.display = 'none';
                    eyeOffIcon.style.display = 'block';
                } else {
                    input.type = 'password';
                    eyeIcon.style.display = 'block';
                    eyeOffIcon.style.display = 'none';
                }
            });
        });

        // Form submission
        form.addEventListener('submit', (e) => {
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

            if (password !== confirmPassword) {
                showMessage('error-message', 'Passwords do not match');
                return;
            }

            // Check if user already exists
            const users = getUsers();
            if (users.find(u => u.email === email)) {
                showMessage('error-message', 'User with this email already exists');
                return;
            }

            // Create new user
            const newUser = {
                id: generateId(),
                name: name,
                email: email,
                password: password, // In production, this should be hashed!
                createdAt: new Date().toISOString()
            };

            users.push(newUser);
            saveUsers(users);

            // Auto-login
            saveSession(newUser);

            // Show success message
            showMessage('success-message', 'Registration successful! Redirecting...', false);

            // Redirect to home page (skip landing)
            setTimeout(() => {
                window.location.href = 'index.html?skipLanding=true';
            }, 1500);
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
            button.addEventListener('click', () => {
                const wrapper = button.closest('.password-input-wrapper');
                const input = wrapper.querySelector('input');
                const eyeIcon = button.querySelector('.eye-icon');
                const eyeOffIcon = button.querySelector('.eye-off-icon');

                if (input.type === 'password') {
                    input.type = 'text';
                    eyeIcon.style.display = 'none';
                    eyeOffIcon.style.display = 'block';
                } else {
                    input.type = 'password';
                    eyeIcon.style.display = 'block';
                    eyeOffIcon.style.display = 'none';
                }
            });
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            hideMessage('error-message');

            const email = document.getElementById('email').value.trim();
            const password = passwordInput.value;
            const rememberMe = document.getElementById('remember-me').checked;

            // Validation
            if (!email || !password) {
                showMessage('error-message', 'All fields are required');
                return;
            }

            if (!isValidEmail(email)) {
                showMessage('error-message', 'Invalid email format');
                return;
            }

            // Find user
            const users = getUsers();
            const user = users.find(u => u.email === email);

            if (!user) {
                showMessage('error-message', 'User not found');
                return;
            }

            if (user.password !== password) {
                showMessage('error-message', 'Incorrect password');
                return;
            }

            // Save session
            saveSession(user);

            // Redirect to home page (skip landing)
            window.location.href = 'index.html?skipLanding=true';
        });
    });
}

// ==========================================
// MAIN PAGE - USER ICON & SESSION
// ==========================================

// Check if we're on the main page (index.html or root)
const currentPath = window.location.pathname;
const isMainPage = currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('index.html') || (!currentPath.includes('login.html') && !currentPath.includes('register.html'));

if (isMainPage) {
    document.addEventListener('DOMContentLoaded', () => {
        updateUserIcon();

        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                clearSession();
                updateUserIcon();
                // Redirect to clothing section after logout
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

    if (!userNameEl || !loginLink || !registerLink || !logoutBtn) return;

    if (session) {
        // User is logged in
        userNameEl.textContent = session.name;
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
    }
}

// Export for use in other scripts
window.authSystem = {
    getSession,
    updateUserIcon,
    clearSession
};
