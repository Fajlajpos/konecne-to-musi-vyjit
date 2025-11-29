const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csurf = require('csurf');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Security Middleware
app.use(helmet({
    contentSecurityPolicy: false, // Disabled for simplicity with inline scripts/styles in existing project
}));

// Rate Limiting (Brute Force Protection)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session Management
app.use(session({
    secret: 'super-secret-key-change-this-in-prod', // In production, use env var
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: true, // Set to true if using HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// CSRF Protection
const csrfProtection = csurf({ cookie: true });
app.use(csrfProtection);

// Middleware to pass CSRF token to all views (if using template engine) or expose via API
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

// 2. API Routes

// Register Endpoint
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    try {
        // Check if user exists
        db.get("SELECT id FROM users WHERE email = ?", [email], async (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (row) return res.status(400).json({ error: 'User already exists' });

            // Hash password
            const hash = await bcrypt.hash(password, 10);

            // Insert new user
            const stmt = db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
            stmt.run(name, email, hash, 'user', function (err) {
                if (err) return res.status(500).json({ error: 'Failed to register user' });

                // Auto-login (create session)
                req.session.userId = this.lastID;
                req.session.role = 'user';
                req.session.name = name;

                res.json({ message: 'Registration successful', user: { id: this.lastID, name, email, role: 'user' } });
            });
            stmt.finalize();
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Login Endpoint
app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });

        const match = await bcrypt.compare(password, user.password_hash);
        if (match) {
            req.session.userId = user.id;
            req.session.role = user.role;
            req.session.name = user.name || 'Admin';
            return res.json({ message: 'Login successful', role: user.role, name: req.session.name });
        } else {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
    });
});

// Logout Endpoint
app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ error: 'Could not log out' });
        res.clearCookie('connect.sid');
        res.json({ message: 'Logged out successfully' });
    });
});

// Middleware to check authentication
const isAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Middleware to check admin role
const isAdmin = (req, res, next) => {
    if (req.session.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Forbidden' });
    }
};

// Admin: Get Users
app.get('/api/admin/users', isAuthenticated, isAdmin, (req, res) => {
    db.all("SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// Admin: Get Orders
app.get('/api/admin/orders', isAuthenticated, isAdmin, (req, res) => {
    const query = `
        SELECT o.id, o.total_price, o.status, o.created_at, o.shipping_address, o.contact_email, o.contact_phone,
               u.name as customer_name, u.email as customer_email
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
        ORDER BY o.created_at DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        // Parse JSON address
        const orders = rows.map(order => ({
            ...order,
            shipping_address: JSON.parse(order.shipping_address || '{}')
        }));
        res.json(orders);
    });
});

// Admin: Get Order Details (Items)
app.get('/api/admin/orders/:id/items', isAuthenticated, isAdmin, (req, res) => {
    const orderId = req.params.id;
    db.all("SELECT * FROM order_items WHERE order_id = ?", [orderId], (err, rows) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(rows);
    });
});

// 3. Serve Static Files (Frontend)
app.use(express.static(__dirname));

// Start Server (HTTPS)
const https = require('https');
const fs = require('fs');

const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'certs', 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'certs', 'cert.pem'))
};

https.createServer(httpsOptions, app).listen(PORT, () => {
    console.log(`Secure Server running on https://localhost:${PORT}`);
});
