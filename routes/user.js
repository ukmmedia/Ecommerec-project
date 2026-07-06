const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { requireUser, redirectIfUserLoggedIn } = require('../middleware/auth');

// ---------- HOME / STORE ----------
router.get('/', (req, res) => {
  const products = db.get('products').value();
  const categories = [...new Set(products.map(p => p.category))];
  res.render('user/home', { user: req.session.user, products, categories });
});

router.get('/product/:id', (req, res) => {
  const product = db.get('products').find({ id: parseInt(req.params.id, 10) }).value();
  if (!product) return res.redirect('/');
  res.render('user/product-detail', { user: req.session.user, product });
});

// ---------- SIGNUP ----------
router.get('/signup', redirectIfUserLoggedIn, (req, res) => {
  res.render('user/signup', { error: req.flash('error') });
});

router.post('/signup', redirectIfUserLoggedIn, (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    req.flash('error', 'Passwords do not match.');
    return res.redirect('/signup');
  }

  const existing = db.get('users').find({ email }).value();
  if (existing) {
    req.flash('error', 'An account with this email already exists.');
    return res.redirect('/signup');
  }

  const users = db.get('users').value();
  const newId = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  const hashed = bcrypt.hashSync(password, 10);

  db.get('users').push({
    id: newId,
    name,
    email,
    password: hashed,
    createdAt: new Date().toISOString()
  }).write();

  req.session.user = { id: newId, name, email };
  res.redirect('/');
});

// ---------- LOGIN ----------
router.get('/login', redirectIfUserLoggedIn, (req, res) => {
  res.render('user/login', { error: req.flash('error') });
});

router.post('/login', redirectIfUserLoggedIn, (req, res) => {
  const { email, password } = req.body;
  const user = db.get('users').find({ email }).value();

  if (!user || !bcrypt.compareSync(password, user.password)) {
    req.flash('error', 'Invalid email or password.');
    return res.redirect('/login');
  }

  req.session.user = { id: user.id, name: user.name, email: user.email };
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  req.session.user = null;
  res.redirect('/');
});

// ---------- CART (session-based) ----------
router.post('/cart/add/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  const product = db.get('products').find({ id: productId }).value();
  if (!product) return res.redirect('/');

  if (!req.session.cart) req.session.cart = [];
  const existingItem = req.session.cart.find(item => item.id === productId);

  if (existingItem) {
    existingItem.qty += 1;
  } else {
    req.session.cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 });
  }

  res.redirect('/cart');
});

router.post('/cart/remove/:id', (req, res) => {
  const productId = parseInt(req.params.id, 10);
  if (req.session.cart) {
    req.session.cart = req.session.cart.filter(item => item.id !== productId);
  }
  res.redirect('/cart');
});

router.get('/cart', (req, res) => {
  const cart = req.session.cart || [];
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  res.render('user/cart', { user: req.session.user, cart, total });
});

// ---------- CHECKOUT ----------
router.get('/checkout', requireUser, (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cart');
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  res.render('user/checkout', { user: req.session.user, cart, total });
});

router.post('/checkout', requireUser, (req, res) => {
  const cart = req.session.cart || [];
  if (cart.length === 0) return res.redirect('/cart');

  const { address, phone } = req.body;
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const orders = db.get('orders').value();
  const newId = orders.length ? Math.max(...orders.map(o => o.id)) + 1 : 1;

  db.get('orders').push({
    id: newId,
    userId: req.session.user.id,
    userName: req.session.user.name,
    items: cart,
    total,
    address,
    phone,
    status: 'Pending',
    createdAt: new Date().toISOString()
  }).write();

  // Decrement stock
  cart.forEach(item => {
    const product = db.get('products').find({ id: item.id }).value();
    if (product) {
      db.get('products').find({ id: item.id }).assign({ stock: Math.max(0, product.stock - item.qty) }).write();
    }
  });

  req.session.cart = [];
  res.render('user/order-success', { user: req.session.user, orderId: newId, total });
});

// ---------- ORDER HISTORY ----------
router.get('/my-orders', requireUser, (req, res) => {
  const orders = db.get('orders').filter({ userId: req.session.user.id }).value().slice().reverse();
  res.render('user/my-orders', { user: req.session.user, orders });
});

module.exports = router;
