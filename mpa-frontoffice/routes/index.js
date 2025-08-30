const express = require('express');
const router = express.Router();
const axios = require('axios');

const bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

// Middleware pour vérifier l'authentification
const checkAuth = async (req, res, next) => {
  const token = req.cookies.token;
  
  // Vérifier si l'utilisateur est connecté
  if (!token) {
    return res.redirect('/');
  }
  
  try {
    // Vérifier la validité du token
    const response = await axios.get('http://localhost:3000/api/users/me', {
      headers: {
        'Cookie': `token=${token}`
      }
    });
    
    if (response.status !== 200) {
      return res.redirect('/');
    }
    
    const data = response.data;
    if (!data.user) {
      return res.redirect('/');
    }
    
    req.user = data.user; // Stocker les données de l'utilisateur dans req
    next();
  } catch (err) {
    console.error('Erreur vérification authentification:', err.message);
    res.redirect('/');
  }
};

// Accueil
router.get('/', async (req, res) => {
  const avis = [
    { nom: 'Aude L.', texte: "Une street food de qualité, servis vite et bien." },
    { nom: 'Rayan N.', texte: "Ravis par les menus et l'accueil. Driv'n Cook au top !" },
    { nom: 'Lucie G.', texte: 'Ingrédients frais et locaux, j’adore.' }
  ];
  res.render('accueil', { title: "Driv'n Cook", avis });
});

// Inscription
router.get('/register', (req, res) => {
  res.render('index', { title: 'Inscription' });
});

// Mon compte
router.get('/account', (req, res) => {
  res.render('account', { title: 'Mon Compte' });
});

// Déconnexion
router.get('/logout', (req, res) => {
  res.send(`<script>localStorage.removeItem('token');localStorage.removeItem('user');window.location.href='/'</script>`);
});

// Pages nouvelles
router.get('/menu', (req, res) => res.render('menu', { title: 'Menu' }));
router.get('/carte', (req, res) => res.render('carte', { title: 'Carte' }));

// Page Mon Camion (protégée: franchisé)
router.get('/mon-camion', checkAuth, async (req, res) => {
  try {
    // On rend la vue, les appels API seront faits côté client
    res.render('mon-camion', { title: 'Mon camion' });
  } catch (e) {
    console.error('Erreur Mon Camion:', e.message);
    res.status(500).render('404', { title: 'Erreur' });
  }
});

module.exports = router;
