# Full-Stack E-commerce Store (Admin + User)

Node.js + Express + EJS + lowdb (JSON file database, no native deps needed).

## Setup
```
npm install
npm start
```
Server runs at http://localhost:3000

## Admin Login
URL: http://localhost:3000/admin/login
Email: admin@site.com
Password: Admin@123

**Change this password before deploying** — edit db/database.js seed or add an admin-management route.

## User Site
http://localhost:3000 — browse products, sign up, add to cart, checkout (WhatsApp-style address/phone flow, no payment gateway wired in — add one for production, e.g. JazzCash/EasyPaisa/Stripe).

## Structure
- `index.js` — server entry
- `routes/admin.js` — admin auth + dashboard + product/order/user management
- `routes/user.js` — storefront, auth, cart, checkout
- `middleware/auth.js` — session guards
- `db/database.js` — lowdb setup + seed data (stored in db/db.json, auto-created)
- `views/admin/*` — admin EJS templates
- `views/user/*` — storefront EJS templates
- `public/admin/admin.css`, `public/user/store.css` — styles

## Notes
- Passwords hashed with bcrypt.
- Sessions via express-session (cookie-based, 1 day expiry).
- Swap lowdb for MySQL/Postgres later — the `db.get('table').find()...write()` pattern is the only thing to replace across routes.
- Add real product images to `public/images/`.
