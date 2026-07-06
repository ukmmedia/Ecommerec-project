const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const bcrypt = require('bcryptjs');
const path = require('path');

const adapter = new FileSync(path.join(__dirname, 'db.json'));
const db = low(adapter);

// Seed default structure
db.defaults({
  admins: [],
  users: [],
  products: [],
  orders: []
}).write();

// Seed one admin account if none exists (admin@site.com / Admin@123)
if (db.get('admins').size().value() === 0) {
  db.get('admins').push({
    id: 1,
    name: 'Super Admin',
    email: 'admin@site.com',
    password: bcrypt.hashSync('Admin@123', 10),
    role: 'admin',
    createdAt: new Date().toISOString()
  }).write();
}

// Seed a few demo products if none exist
if (db.get('products').size().value() === 0) {
  const demoProducts = [
    { id: 1, name: 'Classic Leather Wallet', price: 2500, stock: 40, category: 'Accessories', image: '/images/product1.jpg', description: 'Premium handcrafted leather wallet with multiple card slots.' },
    { id: 2, name: 'Wireless Bluetooth Headphones', price: 6500, stock: 25, category: 'Electronics', image: '/images/product2.jpg', description: 'Noise-cancelling over-ear headphones with 30hr battery life.' },
    { id: 3, name: 'Minimalist Wrist Watch', price: 4800, stock: 15, category: 'Accessories', image: '/images/product3.jpg', description: 'Elegant stainless steel wrist watch, water resistant.' },
    { id: 4, name: 'Ceramic Coffee Mug Set', price: 1800, stock: 60, category: 'Home', image: '/images/product4.jpg', description: 'Set of 2 handmade ceramic mugs, dishwasher safe.' }
  ];
  db.set('products', demoProducts).write();
}

module.exports = db;
