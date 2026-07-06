const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../db/database');
const { requireAdmin, redirectIfAdminLoggedIn } = require('../middleware/auth');

// ---------- LOGIN ----------
router.get('/login', redirectIfAdminLoggedIn, (req, res) => {
  res.render('admin/login', { error: req.flash('error'), success: req.flash('success') });
});

router.post('/login', redirectIfAdminLoggedIn, (req, res) => {
  const { email, password } = req.body;
  const admin = db.get('admins').find({ email }).value();

  if (!admin) {
    req.flash('error', 'Invalid email or password.');
    return res.redirect('/admin/login');
  }

  const match = bcrypt.compareSync(password, admin.password);
  if (!match) {
    req.flash('error', 'Invalid email or password.');
    return res.redirect('/admin/login');
  }

  req.session.admin = { id: admin.id, name: admin.name, email: admin.email };
  res.redirect('/admin/dashboard');
});

router.post('/logout', (req, res) => {
  req.session.admin = null;
  res.redirect('/admin/login');
});

// ---------- DASHBOARD ----------
router.get('/dashboard', requireAdmin, (req, res) => {
  const products = db.get('products').value();
  const users = db.get('users').value();
  const orders = db.get('orders').value();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const lowStock = products.filter(p => p.stock < 10);

  res.render('admin/dashboard', {
    admin: req.session.admin,
    stats: {
      totalProducts: products.length,
      totalUsers: users.length,
      totalOrders: orders.length,
      totalRevenue,
      lowStockCount: lowStock.length
    },
    recentOrders: orders.slice(-5).reverse(),
    lowStock
  });
});

// ---------- PRODUCTS ----------
router.get('/products', requireAdmin, (req, res) => {
  const products = db.get('products').value();
  res.render('admin/products', { admin: req.session.admin, products, success: req.flash('success'), error: req.flash('error') });
});

router.get('/products/new', requireAdmin, (req, res) => {
  res.render('admin/product-form', { admin: req.session.admin, product: null });
});

router.post('/products/new', requireAdmin, (req, res) => {
  const { name, price, stock, category, description, image } = req.body;
  const products = db.get('products').value();
  const newId = products.length ? Math.max(...products.map(p => p.id)) + 1 : 1;

  db.get('products').push({
    id: newId,
    name,
    price: parseFloat(price),
    stock: parseInt(stock, 10),
    category,
    description,
    image: image || '/images/placeholder.jpg'
  }).write();

  req.flash('success', 'Product added successfully.');
  res.redirect('/admin/products');
});

router.get('/products/:id/edit', requireAdmin, (req, res) => {
  const product = db.get('products').find({ id: parseInt(req.params.id, 10) }).value();
  if (!product) return res.redirect('/admin/products');
  res.render('admin/product-form', { admin: req.session.admin, product });
});

router.post('/products/:id/edit', requireAdmin, (req, res) => {
  const { name, price, stock, category, description, image } = req.body;
  db.get('products')
    .find({ id: parseInt(req.params.id, 10) })
    .assign({ name, price: parseFloat(price), stock: parseInt(stock, 10), category, description, image })
    .write();

  req.flash('success', 'Product updated successfully.');
  res.redirect('/admin/products');
});

router.post('/products/:id/delete', requireAdmin, (req, res) => {
  db.get('products').remove({ id: parseInt(req.params.id, 10) }).write();
  req.flash('success', 'Product deleted.');
  res.redirect('/admin/products');
});

// ---------- USERS ----------
router.get('/users', requireAdmin, (req, res) => {
  const users = db.get('users').value();
  res.render('admin/users', { admin: req.session.admin, users });
});

router.post('/users/:id/delete', requireAdmin, (req, res) => {
  db.get('users').remove({ id: parseInt(req.params.id, 10) }).write();
  req.flash('success', 'User removed.');
  res.redirect('/admin/users');
});

// ---------- ORDERS ----------
router.get('/orders', requireAdmin, (req, res) => {
  const orders = db.get('orders').value().slice().reverse();
  res.render('admin/orders', { admin: req.session.admin, orders });
});

router.post('/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body;
  db.get('orders').find({ id: parseInt(req.params.id, 10) }).assign({ status }).write();
  req.flash('success', 'Order status updated.');
  res.redirect('/admin/orders');
});

module.exports = router;
