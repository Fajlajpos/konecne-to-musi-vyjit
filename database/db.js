const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.resolve(__dirname, 'shop.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        initDb();
    }
});

function initDb() {
    db.serialize(() => {
        // 1. Users Table (Unified for Admins and Customers)
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT,
            role TEXT DEFAULT 'user',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // 2. Orders Table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total_price REAL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            shipping_address TEXT,
            contact_email TEXT,
            contact_phone TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`);

        // 3. Order Items Table
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_name TEXT,
            quantity INTEGER,
            price REAL,
            FOREIGN KEY(order_id) REFERENCES orders(id)
        )`);

        // Seed Admin User
        seedAdmin();
    });
}

async function seedAdmin() {
    const adminEmail = 'filipmayer7@gmail.com';
    const adminPassword = 'Nevimnevim16';
    const saltRounds = 10;

    db.get("SELECT id FROM users WHERE email = ?", [adminEmail], async (err, row) => {
        if (err) {
            console.error(err.message);
            return;
        }
        if (!row) {
            try {
                const hash = await bcrypt.hash(adminPassword, saltRounds);
                const stmt = db.prepare("INSERT INTO users (email, password_hash, name, role) VALUES (?, ?, ?, ?)");
                stmt.run(adminEmail, hash, 'Filip', 'admin', (err) => {
                    if (err) {
                        console.error('Error creating admin:', err.message);
                    } else {
                        console.log('Admin user "Filip" created successfully.');
                    }
                });
                stmt.finalize();
            } catch (error) {
                console.error('Error hashing password:', error);
            }
        } else {
            console.log('Admin user already exists.');
        }
    });
}

module.exports = db;
