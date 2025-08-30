# Driv'n Cook 🚚🍔

**Projet Annuel - 2A2**  
**Loris RAMEAU & Thomas GALLOIS**

Application de gestion de food trucks avec système de commandes en ligne, gestion des franchisés et back-office administratif.

## 🏗️ Architecture

Le projet est divisé en 3 composants principaux :

- **API** (Port 3000) : Backend Node.js/Express avec base SQLite
- **Front-Office** (Port 4000) : Interface client EJS + Bootstrap
- **Back-Office** (Port 5000) : Administration Vue.js

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn

### 1. Installation des dépendances

```bash
# API
cd api
npm install

# Front-Office  
cd ../mpa-frontoffice
npm install

# Back-Office
cd ../spa-backoffice
npm install
```

### 2. Configuration des variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
# API
API_PORT=3000
FRONT_PORT=4000
BACK_PORT=5000

# Base de données
DATABASE_URL=./db.sqlite

# JWT
JWT_SECRET=your-secret-key

# Admin par défaut
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=admin123

# SMTP (optionnel)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 3. Lancement du projet

```bash
# Lancer tous les services
npm run dev
```

Cette commande démarre :
- API sur http://localhost:3000
- Front-Office sur http://localhost:4000  
- Back-Office sur http://localhost:5000

## 🔧 Développement

### Ports par défaut
- **API** : 3000 (http://localhost:3000)
- **Front-Office** : 4000 (http://localhost:4000)
- **Back-Office** : 5000 (http://localhost:5000)

### Variables d'environnement

#### Développement
```env
NODE_ENV=development
API_PORT=3000
FRONT_PORT=4000
BACK_PORT=5000
```

#### Production  
```env
NODE_ENV=production
API_PORT=80
FRONT_PORT=443
BACK_PORT=8080
# Ajouter HTTPS, domaines, etc.
```

### Scripts disponibles

```bash
# API
cd api
npm run dev      # Démarrage avec nodemon
npm start        # Démarrage production

# Front-Office
cd mpa-frontoffice  
npm run dev      # Démarrage avec nodemon
npm start        # Démarrage production

# Back-Office
cd spa-backoffice
npm run dev      # Démarrage avec Vite
npm run build    # Build production
npm run preview  # Prévisualisation build
```

## 📁 Structure du projet

```
projetAnnuel/
├── api/                    # Backend API (Port 3000)
│   ├── src/
│   │   ├── routes/        # Routes API
│   │   ├── controllers/   # Contrôleurs
│   │   ├── services/      # Logique métier
│   │   ├── utils/         # Utilitaires (DB, auth, mailer)
│   │   └── server.js      # Point d'entrée
│   ├── db.sqlite          # Base de données
│   └── package.json
├── mpa-frontoffice/        # Front-Office EJS (Port 4000)
│   ├── views/             # Templates EJS
│   ├── public/            # Assets statiques
│   ├── routes/            # Routes front-office
│   └── package.json
├── spa-backoffice/         # Back-Office Vue.js (Port 5000)
│   ├── src/
│   │   ├── components/    # Composants Vue
│   │   ├── views/         # Pages
│   │   └── App.vue        # Composant racine
│   └── package.json
└── README.md
```

## 🗄️ Base de données

- **SQLite** avec schéma automatique
- Tables : users, trucks, orders, payouts, franchises, etc.
- Migrations automatiques au démarrage
- Données de test incluses

## 🔐 Authentification

- **JWT** pour les sessions
- Rôles : client, franchisé, ADMIN
- Middleware `ensureAuth` et `ensureRole`
- Protection CSRF et XSS

## 🌐 Fonctionnalités

### Front-Office
- Menu avec images et descriptions
- Système de commandes avec panier
- Carte interactive des food trucks
- Système de fidélité et points
- Interface multilingue (FR/EN/ES)

### Back-Office  
- Gestion des franchisés
- Gestion des camions et entrepôts
- Suivi des commandes et retraits
- Tableaux de bord et statistiques
- Export PDF des rapports

### API
- Endpoints RESTful documentés
- Swagger UI sur `/api/docs`
- Validation des données
- Gestion des erreurs
- Rate limiting

## 📚 Documentation API

- **Swagger UI** : http://localhost:3000/api/docs
- Endpoints documentés avec exemples
- Schémas de requêtes/réponses
- Tests interactifs

## 🧪 Tests

```bash
# Tests unitaires
npm test

# Tests d'intégration  
npm run test:integration

# Tests de charge
npm run test:load
```

## 🚀 Déploiement

### Développement
```bash
npm run dev
```

### Production
```bash
# Build des assets
cd spa-backoffice && npm run build

# Démarrage des services
npm start
```

Ce projet est développé dans le cadre du projet annuel 2A2.

## 👥 Auteurs

- **Loris RAMEAU** - Développement Front-Office & API
- **Thomas GALLOIS** - Développement Back-Office & API

---

**Driv'n Cook** - Modernisation du système d'information des food trucks 🚚✨