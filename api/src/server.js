const path = require('path');
const fs = require('fs');
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const colors = require('colors');
const { initDb, seedAdminAndWarehouses, db } = require('./utils/db');
const { ensureAuth, ensureRole } = require('./utils/auth');
const config = require('./utils/config');

// Load .env from project root if present
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const app = express();

app.use(helmet());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS config
const allowedOrigins = [
  `http://localhost:${process.env.FRONT_PORT || 4000}`,
  `http://localhost:${process.env.BACK_PORT || 5000}`,
  'https://axia.quest',
  'https://admin.axia.quest'
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(null, true); // permissif pour faciliter la démo; à restreindre en prod stricte
  },
  credentials: true
}));

// Swagger minimal
const swaggerDoc = require('./swagger.json');
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc, { explorer: true }));

// Routers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/franchises', require('./routes/franchises'));
app.use('/api/warehouses', require('./routes/warehouses'));
app.use('/api/trucks', require('./routes/trucks'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payouts', require('./routes/payouts'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/map', require('./routes/map'));
app.use('/api/loyalty', require('./routes/loyalty'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/reviews', require('./routes/reviews'));

// Serve static uploads (proofs, documents)
app.use('/uploads', express.static(config.uploadDir));

// Simple stats endpoint for dashboard
app.get('/api/stats', ensureAuth, (req, res, next) => {
  if (req.user.role === 'ADMIN' || req.user.role === 'administrateur') {
    next();
  } else {
    res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
}, async (req, res) => {
  try {
    const { all, get } = require('./utils/db');
    // Utilisateurs
    const clients = (await all("SELECT COUNT(*) as c FROM users WHERE role = 'client'"))[0].c;
    const franchisees = (await all("SELECT COUNT(*) as c FROM users WHERE role = 'franchisé'"))[0].c;
    const admins = (await all("SELECT COUNT(*) as c FROM users WHERE role = 'ADMIN'"))[0].c;
    // Camions
    const trucks = (await all('SELECT COUNT(*) as c FROM trucks'))[0].c;
    const trucksAssigned = (await all('SELECT COUNT(*) as c FROM trucks WHERE franchisee_user_id IS NOT NULL'))[0].c;
    // Commandes
    const ordersTotal = (await all('SELECT COUNT(*) as c FROM orders'))[0].c;
    const ordersPending = (await all("SELECT COUNT(*) as c FROM orders WHERE status='pending'"))[0].c;
    const ordersReady = (await all("SELECT COUNT(*) as c FROM orders WHERE status='ready'"))[0].c;
    const ordersCompleted = (await all("SELECT COUNT(*) as c FROM orders WHERE status='completed'"))[0].c;
    const revenueCents = (await all('SELECT COALESCE(SUM(total_cents),0) as s FROM orders WHERE status = "completed"'))[0].s;
    // Retraits
    const payoutsRequested = (await all("SELECT COUNT(*) as c FROM payouts WHERE status='requested'"))[0].c;
    const payoutsApproved = (await all("SELECT COUNT(*) as c FROM payouts WHERE status='approved'"))[0].c;
    const payoutsDone = (await all("SELECT COUNT(*) as c FROM payouts WHERE status='done'"))[0].c;
    const payoutsAmountCents = (await all("SELECT COALESCE(SUM(amount_cents),0) as s FROM payouts WHERE status IN ('approved','done')"))[0].s;
    res.json({
      users: { clients, franchisees, admins },
      trucks: { total: trucks, assigned: trucksAssigned },
      orders: { total: ordersTotal, pending: ordersPending, ready: ordersReady, completed: ordersCompleted },
      payouts: { requested: payoutsRequested, approved: payoutsApproved, done: payoutsDone, amount_eur: Number((payoutsAmountCents/100).toFixed(2)) },
      revenue_eur: Number((revenueCents/100).toFixed(2))
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

// Boot
(async () => {
  await initDb();
  await seedAdminAndWarehouses();
  const port = process.env.API_PORT || 3000;
  app.listen(port, () => {
    console.log(colors.green.bold(`✔ API Driv'n Cook`), colors.gray(`écoute sur`), colors.cyan(`http://localhost:${port}`));
    console.log(colors.gray('Swagger:'), colors.cyan(`http://localhost:${port}/api/docs`));
  });
})();



