import { createApp } from 'vue'
import App from './App.vue'
import './assets/global.css';  
import "@fortawesome/fontawesome-free/css/all.min.css"

fetch('https://api.axia.quest/api/auth/me', { credentials: 'include' })
  .then(res => {
    return res.json();
  })
  .then(data => {
    if (!data.user || !['modérateur', 'administrateur', 'admin'].includes((data.user.role || '').toLowerCase())) {
      console.log("[DEBUG] Utilisateur non autorisé ou non connecté, redirection vers accueil");
      console.log("[DEBUG] Rôle utilisateur:", data.user?.role);
      window.location.href = 'https://axia.quest/';
    } else {
      console.log("[DEBUG] Utilisateur autorisé, création de l'app");
      createApp(App).mount('#app');
    }
  })
  .catch((err) => {
    console.log("[DEBUG] Erreur lors de la requête /api/auth/me:", err);
    window.location.href = 'https://axia.quest/';
  });
