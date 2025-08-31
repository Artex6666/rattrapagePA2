<template>
  <div class="loyalty-management">
    <div class="header-section">
      <h2 class="page-title">Configuration de la Fidélité</h2>
      <p class="page-subtitle">Gérez les paramètres du système de points fidélité</p>
    </div>

    <!-- Configuration actuelle -->
    <div class="card p-4 mb-4">
      <h4>Configuration actuelle</h4>
      <div class="row">
        <div class="col-md-6">
          <div class="config-item">
            <label class="form-label">Points par unité de dépense</label>
            <input v-model.number="config.points_per_spend_unit" type="number" class="form-control" min="1">
          </div>
        </div>
        <div class="col-md-6">
          <div class="config-item">
            <label class="form-label">Unité de dépense (€)</label>
            <input v-model.number="config.spend_unit_euro" type="number" class="form-control" min="1">
          </div>
        </div>
        <div class="col-md-6">
          <div class="config-item">
            <label class="form-label">Seuil de récompense (points)</label>
            <input v-model.number="config.reward_threshold_points" type="number" class="form-control" min="1">
          </div>
        </div>
        <div class="col-md-6">
          <div class="config-item">
            <label class="form-label">Menus offerts par récompense</label>
            <input v-model.number="config.reward_free_menus" type="number" class="form-control" min="1">
          </div>
        </div>
        <div class="col-12">
          <button @click="saveConfig" class="btn btn-primary">Sauvegarder la configuration</button>
        </div>
      </div>
    </div>

    <!-- Gestion des utilisateurs fidélité -->
    <div class="card p-4 mb-4">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h4 class="mb-0">Utilisateurs & points</h4>
        <div class="d-flex" style="gap:.5rem;">
          <input v-model="userSearch" class="form-control" placeholder="Rechercher (email, nom)..." style="max-width:260px;">
          <button @click="loadUsers" class="btn btn-secondary">Rafraîchir</button>
        </div>
      </div>
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Email</th>
              <th>Points</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id">
              <td>{{ u.id }}</td>
              <td>{{ formatName(u.first_name, u.last_name) }}</td>
              <td>{{ u.email }}</td>
              <td><span class="badge bg-info">{{ u.loyalty_points }}</span></td>
              <td>
                <div class="d-flex" style="gap:.5rem;">
                  <input v-model.number="u.delta" type="number" class="form-control" placeholder="Δ points" style="max-width:120px;">
                  <button @click="applyDelta(u, +Math.abs(u.delta || 0))" class="btn btn-success btn-sm">+ Ajouter</button>
                  <button @click="applyDelta(u, -Math.abs(u.delta || 0))" class="btn btn-warning btn-sm">- Retirer</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Statistiques fidélité (placeholder) -->
    <div class="card p-4">
      <h4>Statistiques de fidélité</h4>
      <div class="row">
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalUsers }}</div>
            <div class="stat-label">Utilisateurs inscrits</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-number">{{ stats.totalPoints }}</div>
            <div class="stat-label">Points distribués</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-number">{{ stats.activeUsers }}</div>
            <div class="stat-label">Utilisateurs actifs</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="stat-card">
            <div class="stat-number">{{ stats.redeemedDiscounts }}</div>
            <div class="stat-label">Réductions utilisées</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Message de succès/erreur -->
    <div v-if="message" :class="['alert', messageClass]" class="mt-3">
      {{ message }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoyaltyManagement',
  data() {
    return {
      config: {
        points_per_spend_unit: 10,
        spend_unit_euro: 10,
        reward_threshold_points: 100,
        reward_free_menus: 1
      },
      users: [],
      userSearch: '',
      stats: {
        totalUsers: 0,
        totalPoints: 0,
        activeUsers: 0,
        redeemedDiscounts: 0
      },
      message: '',
      messageClass: 'alert-success'
    }
  },
  methods: {
    async loadConfig() {
      try {
        const response = await fetch('https://api.axia.quest/api/loyalty/config', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          this.config = { ...this.config, ...data };
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
      }
    },

    async saveConfig() {
      try {
        const response = await fetch('https://api.axia.quest/api/loyalty/config', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(this.config)
        });

        if (response.ok) {
          this.showMessage('Configuration sauvegardée avec succès !', 'success');
        } else {
          this.showMessage('Erreur lors de la sauvegarde', 'danger');
        }
      } catch (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        this.showMessage('Erreur lors de la sauvegarde', 'danger');
      }
    },

    async loadUsers() {
      try {
        const q = this.userSearch ? `?q=${encodeURIComponent(this.userSearch)}` : '';
        const r = await fetch(`https://api.axia.quest/api/loyalty/users${q}`, { credentials: 'include' });
        if (r.ok) {
          this.users = await r.json();
          this.stats.totalUsers = this.users.length;
          this.stats.totalPoints = this.users.reduce((s,u)=>s+Number(u.loyalty_points||0),0);
        }
      } catch(e) { console.error(e); }
    },

    async applyDelta(user, delta) {
      if (!delta || !Number.isFinite(delta)) return;
      try {
        const r = await fetch(`https://api.axia.quest/api/loyalty/users/${user.id}/points`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ delta })
        });
        const data = await r.json();
        if (r.ok) {
          user.loyalty_points = data.loyalty_points;
          user.delta = 0;
          this.showMessage('Points mis à jour', 'success');
        } else {
          this.showMessage(data.error || 'Erreur lors de la mise à jour', 'danger');
        }
      } catch(e) {
        console.error(e);
        this.showMessage('Erreur lors de la mise à jour', 'danger');
      }
    },

    showMessage(text, type) {
      this.message = text;
      this.messageClass = `alert-${type}`;
      setTimeout(() => {
        this.message = '';
      }, 2000);
    },

    loadStats() {
      // placeholder basique basé sur users chargés
      this.stats.activeUsers = Math.round(this.stats.totalUsers * 0.7);
      this.stats.redeemedDiscounts = Math.round(this.stats.totalUsers * 0.2);
    },

    formatName(fn, ln) {
      const parts = [];
      if (fn) parts.push(fn);
      if (ln) parts.push(ln);
      return parts.join(' ') || '—';
    }
  },
  mounted() {
    this.loadConfig();
    this.loadUsers().then(()=>this.loadStats());
  }
}
</script>

<style scoped>
.loyalty-management {
  padding: 1.5rem;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.page-title {
  color: #2c3e50;
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #6c757d;
  font-size: 1rem;
}

.config-item {
  margin-bottom: 1rem;
}

.stat-card {
  text-align: center;
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.stat-number {
  font-size: 2rem;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #6c757d;
  font-size: 0.9rem;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.alert-success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.alert-danger {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}
</style>
