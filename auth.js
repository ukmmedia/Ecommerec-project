function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }
  req.flash('error', 'Please log in as admin to continue.');
  return res.redirect('/admin/login');
}

function requireUser(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'Please log in to continue.');
  return res.redirect('/login');
}

function redirectIfAdminLoggedIn(req, res, next) {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  }
  next();
}

function redirectIfUserLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/');
  }
  next();
}

module.exports = { requireAdmin, requireUser, redirectIfAdminLoggedIn, redirectIfUserLoggedIn };
