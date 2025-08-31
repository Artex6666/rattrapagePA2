<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <h2>Driv'n Cook Admin</h2>
    </div>
    <ul class="sidebar-menu">
      <li @click="goToAccueil">
        <i class="fas fa-arrow-left"></i>
        <span>Retour à l'accueil</span>
      </li>
      <li :class="{ active: currentPage === 'incidents' }" @click="$emit('change-page', 'incidents')">
        <i class="fas fa-exclamation-triangle"></i>
        <span>Incidents</span>
      </li>
      <li :class="{ active: currentPage === 'dashboard' }" @click="$emit('change-page', 'dashboard')">
        <i class="fas fa-home"></i>
        <span>Dashboard</span>
      </li>
      <li :class="{ active: currentPage === 'utilisateurs' }" @click="$emit('change-page', 'utilisateurs')">
        <i class="fas fa-user"></i>
        <span>Utilisateurs</span>
      </li>
      <li :class="{ active: currentPage === 'franchises' }" @click="$emit('change-page', 'franchises')">
        <i class="fas fa-id-card"></i>
        <span>Dossiers Franchisés</span>
      </li>
      <li :class="{ active: currentPage === 'warehouses' }" @click="$emit('change-page', 'warehouses')">
        <i class="fas fa-warehouse"></i>
        <span>Entrepôts</span>
      </li>
      <li :class="{ active: currentPage === 'trucks' }" @click="$emit('change-page', 'trucks')">
        <i class="fas fa-truck"></i>
        <span>Camions</span>
      </li>
      <li :class="{ active: currentPage === 'loyalty' }" @click="$emit('change-page', 'loyalty')">
        <i class="fas fa-star"></i>
        <span>Fidélité</span>
      </li>
      <li :class="{ active: currentPage === 'payouts' }" @click="$emit('change-page', 'payouts')">
        <i class="fas fa-credit-card"></i>
        <span>Retraits</span>
      </li>
      <li :class="{ active: currentPage === 'newsletter' }" @click="$emit('change-page', 'newsletter')">
        <i class="fas fa-envelope"></i>
        <span>Newsletter</span>
      </li>
      <li :class="{ active: currentPage === 'reviews' }" @click="$emit('change-page', 'reviews')">
        <i class="fas fa-comments"></i>
        <span>Avis</span>
      </li>
      <li :class="{ active: currentPage === 'orders' }" @click="$emit('change-page', 'orders')">
        <i class="fas fa-shopping-cart"></i>
        <span>Commandes</span>
      </li>

    </ul>
  </aside>
</template>

<script>
export default {
  name: "SidebarMenu",
  props: {
    currentPage: {
      type: String,
      default: "dashboard"
    }
  },
  methods: {
    goToAccueil() {
      window.location.href = 'https://axia.quest/';
    }
  }
}
</script>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: 240px;
  height: 100vh;         
  background: linear-gradient(180deg, #2c3e50 0%, #34495e 100%);
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 20px rgba(0, 0, 0, 0.15);
}

.sidebar-brand {
  padding: 1.5rem;
  text-align: center;
  border-bottom: 1px solid rgba(236, 240, 241, 0.2);
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
}
.sidebar-brand h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: bold;
}


.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1; 
}

.sidebar-menu li {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 2px 0;
  border-radius: 0 25px 25px 0;
  position: relative;
  overflow: hidden;
}

.sidebar-menu li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #3498db, #2980b9);
  transition: width 0.3s ease;
  z-index: 1;
}

.sidebar-menu li:hover::before {
  width: 100%;
}

.sidebar-menu li:hover {
  transform: translateX(5px);
  background: rgba(52, 152, 219, 0.1);
}

.sidebar-menu li.active {
  background: linear-gradient(90deg, #3498db, #2980b9);
  box-shadow: 0 2px 15px rgba(52, 152, 219, 0.3);
  transform: translateX(5px);
}

.sidebar-menu li.active::before {
  display: none;
}

.sidebar-menu li i {
  margin-right: 12px;
  font-size: 1.1rem;
  z-index: 2;
  position: relative;
}

.sidebar-menu li span {
  font-size: 1rem;
  font-weight: 500;
  z-index: 2;
  position: relative;
}
</style>
