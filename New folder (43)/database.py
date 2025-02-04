import sqlite3
from datetime import datetime
import hashlib
import os

class Database:
    def __init__(self):
        # Create database directory if it doesn't exist
        if not os.path.exists('db'):
            os.makedirs('db')
        
        self.conn = sqlite3.connect('db/store.db')
        self.cursor = self.conn.cursor()
        self.create_tables()

    def create_tables(self):
        # Users table
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            fullname TEXT NOT NULL,
            registered_date DATETIME NOT NULL
        )
        ''')

        # Purchases table
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            product_name TEXT NOT NULL,
            price REAL NOT NULL,
            payment_method TEXT NOT NULL,
            purchase_date DATETIME NOT NULL,
            order_id TEXT UNIQUE NOT NULL,
            item TEXT NOT NULL,
            delivered BOOLEAN NOT NULL DEFAULT 0,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
        ''')

        self.conn.commit()

    def hash_password(self, password):
        return hashlib.sha256(password.encode()).hexdigest()

    def register_user(self, email, password, fullname):
        try:
            hashed_password = self.hash_password(password)
            self.cursor.execute('''
            INSERT INTO users (email, password, fullname, registered_date)
            VALUES (?, ?, ?, ?)
            ''', (email.lower(), hashed_password, fullname, datetime.now()))
            self.conn.commit()
            return True
        except sqlite3.IntegrityError:
            return False  # Email already exists

    def verify_user(self, email, password):
        hashed_password = self.hash_password(password)
        self.cursor.execute('''
        SELECT id, fullname FROM users 
        WHERE email = ? AND password = ?
        ''', (email.lower(), hashed_password))
        return self.cursor.fetchone()

    def add_purchase(self, email, product_name, price, payment_method, order_id, item):
        # Get user_id
        self.cursor.execute('SELECT id FROM users WHERE email = ?', (email.lower(),))
        user_id = self.cursor.fetchone()[0]

        self.cursor.execute('''
        INSERT INTO purchases (user_id, product_name, price, payment_method, 
                             purchase_date, order_id, item, delivered)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (user_id, product_name, price, payment_method, 
              datetime.now(), order_id, item, False))
        self.conn.commit()

    def get_user_purchases(self, email):
        self.cursor.execute('''
        SELECT p.* FROM purchases p
        JOIN users u ON p.user_id = u.id
        WHERE u.email = ?
        ORDER BY p.purchase_date DESC
        ''', (email.lower(),))
        return self.cursor.fetchall()

    def update_purchase_status(self, order_id, delivered=True):
        self.cursor.execute('''
        UPDATE purchases SET delivered = ?
        WHERE order_id = ?
        ''', (delivered, order_id))
        self.conn.commit()

    def close(self):
        self.conn.close() 