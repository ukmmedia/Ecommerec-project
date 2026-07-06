const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');
require('dotenv').config();

const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

app.use(flash());

// Make user/admin session available in all views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.currentAdmin = req.session.admin || null;
  res.locals.cartCount = (req.session.cart || []).reduce((sum, i) => sum + i.qty, 0);
  next();
});

// Routes
app.use('/admin', adminRoutes);
app.use('/', userRoutes);

// 404
app.use((req, res) => {
  res.status(404).send('<h1>404 - Page Not Found</h1><a href="/">Go Home</a>');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`Admin login: http://localhost:${PORT}/admin/login (admin@site.com / Admin@123)`);
});
