<template>
  <div class="incident-management">
    <div class="header-section">
      <h2 class="page-title">Gestion des Incidents</h2>
      <p class="page-subtitle">Suivez et gérez les incidents sur les camions et entrepôts</p>
    </div>

    <!-- Statistiques des incidents -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">Total des incidents</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-number">{{ stats.open }}</div>
          <div class="stat-label">Incidents ouverts</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-number">{{ stats.critical }}</div>
          <div class="stat-label">Priorité critique</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-number">{{ stats.resolved }}</div>
          <div class="stat-label">Résolus ce mois</div>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div class="card p-4 mb-4">
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Statut</label>
          <select v-model="filterStatus" class="form-select">
            <option value="">Tous les statuts</option>
            <option value="ouvert">Ouvert</option>
            <option value="en_cours">En cours</option>
            <option value="résolu">Résolu</option>
            <option value="fermé">Fermé</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">Priorité</label>
          <select v-model="filterPriority" class="form-select">
            <option value="">Toutes les priorités</option>
            <option value="basse">Basse</option>
            <option value="moyenne">Moyenne</option>
            <option value="haute">Haute</option>
            <option value="critique">Critique</option>
          </select>
        </div>
        <div class="col-md-4">
          <label class="form-label">&nbsp;</label>
          <button @click="loadIncidents" class="btn btn-primary w-100">
            <i class="fas fa-sync-alt me-2"></i>Actualiser
          </button>
        </div>
      </div>
    </div>

    <!-- Liste des incidents -->
    <div class="card p-4">
      <div class="card-header">
        <h4 class="mb-0"><i class="fas fa-exclamation-triangle me-2"></i>Liste des incidents</h4>
      </div>
      <div class="card-body">
        <div class="table-responsive">
          <table class="table table-striped">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Priorité</th>
                <th>Localisation</th>
                <th>Statut</th>
                <th>Franchisé</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="incident in filteredIncidents" :key="incident.id">
                <td><strong>#{{ incident.id }}</strong></td>
                <td>
                  <span :class="getTypeClass(incident.type)" class="badge">
                    {{ incident.type }}
                  </span>
                </td>
                <td>
                  <span :class="getPriorityClass(incident.priority)" class="badge">
                    {{ incident.priority }}
                  </span>
                </td>
                <td>{{ incident.truck?.name || 'N/A' }}</td>
                <td>
                  <span :class="getStatusClass(incident.status)" class="badge">
                    {{ incident.status }}
                  </span>
                </td>
                <td>
                  <span v-if="incident.franchisee?.email" class="text-primary">
                    {{ incident.franchisee.email }}
                  </span>
                  <span v-else class="text-muted">Non assigné</span>
                </td>
                <td>{{ formatDate(incident.created_at) }}</td>
                <td>
                  <button @click="viewIncident(incident)" class="btn btn-sm btn-info">
                    <i class="fas fa-eye"></i> Voir détails
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Modal de visualisation -->
    <div v-if="selectedIncident" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5><i class="fas fa-exclamation-triangle me-2"></i>Incident #{{ selectedIncident.id }}</h5>
          <button @click="closeModal" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <div class="incident-details">
            <!-- Informations de l'incident -->
            <div class="card mb-4">
              <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-exclamation-triangle me-2"></i>Détails de l'incident</h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <p><strong>Type:</strong> 
                      <span :class="getTypeClass(selectedIncident.type)" class="badge ms-2">
                        {{ selectedIncident.type }}
                      </span>
                    </p>
                    <p><strong>Priorité:</strong> 
                      <span :class="getPriorityClass(selectedIncident.priority)" class="badge ms-2">
                        {{ selectedIncident.priority }}
                      </span>
                    </p>
                    <p><strong>Localisation:</strong> {{ selectedIncident.truck?.name || 'N/A' }}</p>
                  </div>
                  <div class="col-md-6">
                    <p><strong>Statut:</strong> 
                      <span :class="getStatusClass(selectedIncident.status)" class="badge ms-2">
                        {{ selectedIncident.status }}
                      </span>
                    </p>
                    <p><strong>Date de création:</strong> {{ formatDate(selectedIncident.created_at) }}</p>
                    <p><strong>Dernière mise à jour:</strong> {{ formatDate(selectedIncident.updated_at || selectedIncident.created_at) }}</p>
                  </div>
                </div>
                <div class="row mt-3">
                  <div class="col-12">
                    <p><strong>Description:</strong></p>
                    <div class="description-text">{{ selectedIncident.description }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Informations du franchisé responsable -->
            <div class="card mb-4">
              <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-user-tie me-2"></i>Franchisé responsable</h6>
              </div>
              <div class="card-body">
                <div v-if="selectedIncident.franchisee" class="row">
                  <div class="col-md-6">
                    <p><strong>Email:</strong> 
                      <a :href="'mailto:' + selectedIncident.franchisee.email" class="text-primary">
                        {{ selectedIncident.franchisee.email }}
                      </a>
                    </p>
                    <p><strong>Prénom:</strong> {{ selectedIncident.franchisee.first_name || 'N/A' }}</p>
                    <p><strong>Nom:</strong> {{ selectedIncident.franchisee.last_name || 'N/A' }}</p>
                  </div>
                  <div class="col-md-6">
                    <p><strong>Camion:</strong> {{ selectedIncident.truck?.name || 'N/A' }}</p>
                  </div>
                </div>
                <div v-else class="text-center text-muted">
                  <i class="fas fa-user-slash fa-3x mb-3"></i>
                  <p>Aucun franchisé assigné à cet incident</p>
                </div>
              </div>
            </div>

            <!-- Actions possibles -->
            <div class="card">
              <div class="card-header">
                <h6 class="mb-0"><i class="fas fa-tools me-2"></i>Actions</h6>
              </div>
              <div class="card-body">
                <div class="row">
                  <div class="col-md-6">
                    <button v-if="selectedIncident.status === 'open'" @click="updateStatus(selectedIncident.id, 'in_progress')" class="btn btn-warning me-2">
                      <i class="fas fa-play"></i> Prendre en charge
                    </button>
                    <button v-if="selectedIncident.status === 'in_progress'" @click="updateStatus(selectedIncident.id, 'resolved')" class="btn btn-success me-2">
                      <i class="fas fa-check"></i> Marquer comme résolu
                    </button>
                  </div>
                  <div class="col-md-6">
                    
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'IncidentManagement',
  data() {
    return {
      incidents: [],
      selectedIncident: null,
      filterStatus: '',
      filterPriority: '',
      stats: {
        total: 0,
        open: 0,
        critical: 0,
        resolved: 0
      }
    }
  },
  computed: {
    filteredIncidents() {
      let filtered = this.incidents;

      if (this.filterStatus) {
        filtered = filtered.filter(incident => incident.status === this.filterStatus);
      }

      if (this.filterPriority) {
        filtered = filtered.filter(incident => incident.priority === this.filterPriority);
      }

      return filtered;
    }
  },
  methods: {
    async loadIncidents() {
      try {
        const response = await fetch('https://api.axia.quest/api/incidents', {
          credentials: 'include'
        });
        if (response.ok) {
          this.incidents = await response.json();
          this.calculateStats();
        }
      } catch (error) {
        console.error('Erreur lors du chargement des incidents:', error);
      }
    },

    calculateStats() {
      this.stats.total = this.incidents.length;
      this.stats.open = this.incidents.filter(i => i.status === 'open').length;
      this.stats.critical = this.incidents.filter(i => i.priority === 'critique').length;
      const thisMonth = new Date().getMonth();
      this.stats.resolved = this.incidents.filter(i => {
        if (i.status === 'resolved' && i.updated_at) {
          return new Date(i.updated_at).getMonth() === thisMonth;
        }
        return false;
      }).length;
    },

    viewIncident(incident) {
      this.selectedIncident = incident;
    },

    async updateStatus(id, newStatus) {
      try {
        const response = await fetch(`https://api.axia.quest/api/incidents/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
          this.loadIncidents();
          this.closeModal();
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour du statut:', error);
      }
    },

    closeModal() {
      this.selectedIncident = null;
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleString('fr-FR');
    },

    getTypeClass(type) {
      switch (type) {
        case 'technique': return 'bg-info';
        case 'accident': return 'bg-danger';
        case 'maintenance': return 'bg-warning';
        default: return 'bg-secondary';
      }
    },

    getPriorityClass(priority) {
      switch (priority) {
        case 'basse': return 'bg-success';
        case 'moyenne': return 'bg-warning';
        case 'haute': return 'bg-danger';
        case 'critique': return 'bg-dark';
        default: return 'bg-secondary';
      }
    },

    getStatusClass(status) {
      switch (status) {
        case 'open': return 'bg-danger';
        case 'in_progress': return 'bg-warning';
        case 'resolved': return 'bg-success';
        default: return 'bg-secondary';
      }
    },

    getFranchiseStatusClass(status) {
      switch (status) {
        case 'actif': return 'bg-success';
        case 'inactif': return 'bg-secondary';
        case 'en_suspension': return 'bg-warning';
        default: return 'bg-secondary';
      }
    }
  },
  mounted() {
    this.loadIncidents();
  }
}
</script>

<style scoped>
.incident-management {
  padding: 1.5rem;
}

.header-section {
  text-align: center;
  margin-bottom: 2rem;
}

.page-title {
  color: var(--primary-color);
  font-size: 2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.page-subtitle {
  color: #6c757d;
  font-size: 1rem;
}

.description-text, .notes-text {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  min-height: 80px;
  font-style: italic;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 900px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
}

.modal-body {
  padding: 1rem;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
}

.badge {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
}

.card-header h6 {
  color: var(--primary-color);
  font-weight: 600;
}

.text-primary {
  color: var(--accent-color) !important;
}
</style>
