const express = require('express'); 
require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
const app = express();
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const cookieParser = require('cookie-parser');

// Configuration du moteur EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware globaux
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

// ✅ Injecte l'utilisateur dans toutes les vues EJS
app.use((req, res, next) => {
  try {
    res.locals.user = req.cookies.user ? JSON.parse(req.cookies.user) : null;
  } catch (e) {
    res.locals.user = null;
  }
  next();
});

// Routes
const indexRouter = require('./routes/index');
app.use('/', indexRouter);

// Redirection par défaut vers /accueil
app.get('/', (req, res) => res.redirect('/accueil'));

// Gestion 404
app.use((req, res) => {
  res.status(404).render('404', { title: 'Page introuvable' });
});

// Lancement du serveur
const port = process.env.FRONT_PORT || 4000;
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
app.listen(port, host, () => {
  console.log(`Driv'n Cook (Front) en ligne sur http://${host}:${port}`);
}); 
