<template>
  <div class="payout-management">
    <div class="header-section">
      <h2 class="page-title">Gestion des Retraits</h2>
      <p class="page-subtitle">Suivez et gérez les demandes de retrait des franchisés</p>
    </div>

    <!-- Filtres -->
    <div class="card p-4 mb-4">
      <div class="row g-3">
        <div class="col-md-3">
          <label class="form-label">Statut</label>
          <select v-model="filterStatus" class="form-select">
            <option value="">Tous les statuts</option>
            <option value="requested">En attente</option>
            <option value="approved">Approuvé</option>
            <option value="rejected">Rejeté</option>
            <option value="done">Traité</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Type d'utilisateur</label>
          <select v-model="filterRole" class="form-select">
            <option value="">Tous</option>
            <option value="franchisé">Franchisés</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Recherche</label>
          <input v-model="searchTerm" type="text" class="form-control" placeholder="Email ou IBAN...">
        </div>
        <div class="col-md-3">
          <label class="form-label">&nbsp;</label>
          <button @click="loadPayouts" class="btn btn-primary w-100">Actualiser</button>
        </div>
      </div>
    </div>

    <!-- Statistiques compactes -->
    <div class="stats-inline mb-3">
      <div class="stat-item"><span class="label">Total</span><span class="value">{{ stats.total }}</span></div>
      <div class="stat-item"><span class="label">En attente</span><span class="value">{{ stats.pending }}</span></div>
      <div class="stat-item"><span class="label">Approuvées</span><span class="value">{{ stats.approved }}</span></div>
      <div class="stat-item"><span class="label">Montant</span><span class="value">{{ stats.totalAmount }}€</span></div>
    </div>

    <!-- Liste des retraits -->
    <div class="card p-4">
      <h4>Demandes de retrait</h4>
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>IBAN</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="payout in filteredPayouts" :key="payout.id">
              <td>{{ payout.id }}</td>
              <td>{{ payout.email }}</td>
              <td>{{ maskIBAN(payout.iban) }}</td>
              <td>{{ formatAmount(payout.amount_cents) }}</td>
              <td>
                <span :class="getStatusClass(payout.status)" class="badge">
                  {{ formatStatus(payout.status) }}
                </span>
              </td>
              <td>{{ formatDate(payout.created_at) }}</td>
              <td>
                <button @click="viewPayout(payout)" class="btn btn-sm btn-info me-2">
                  <i class="fas fa-eye"></i> Voir
                </button>
                <button v-if="payout.status === 'requested'" @click="approvePayout(payout.id)" class="btn btn-sm btn-success me-2">
                  <i class="fas fa-check"></i> Approuver
                </button>
                <button v-if="payout.status === 'requested'" @click="rejectPayout(payout.id)" class="btn btn-sm btn-danger">
                  <i class="fas fa-times"></i> Rejeter
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de visualisation -->
    <div v-if="selectedPayout" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5>Détails du retrait #{{ selectedPayout.id }}</h5>
          <button @click="closeModal" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <div class="payout-details">
            <div class="row">
              <div class="col-md-6">
                <p><strong>IBAN:</strong> {{ selectedPayout.iban }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Montant:</strong> {{ formatAmount(selectedPayout.amount_cents) }}</p>
                <p><strong>Statut:</strong> 
                  <span :class="getStatusClass(selectedPayout.status)" class="badge">
                    {{ formatStatus(selectedPayout.status) }}
                  </span>
                </p>
                <p><strong>Date de demande:</strong> {{ formatDate(selectedPayout.created_at) }}</p>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-12 d-flex justify-content-end gap-2">
                <button v-if="selectedPayout.status==='approved'" @click="markDone(selectedPayout.id)" class="btn btn-sm btn-success">
                  <i class="fas fa-check-double"></i> Effectué
                </button>
                <a href="https://api.axia.quest/api/payouts/pdf" target="_blank" class="btn btn-sm btn-outline-secondary">
                  Télécharger l'historique (PDF)
                </a>
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
  name: 'PayoutManagement',
  data() {
    return {
      payouts: [],
      selectedPayout: null,
      filterStatus: '',
      filterRole: '',
      searchTerm: '',
      stats: {
        total: 0,
        pending: 0,
        approved: 0,
        totalAmount: 0
      }
    }
  },
  computed: {
    filteredPayouts() {
      let filtered = this.payouts;

      if (this.filterStatus) {
        filtered = filtered.filter(payout => payout.status === this.filterStatus);
      }

      if (this.filterRole) {
        filtered = filtered.filter(payout => payout.role === this.filterRole);
      }

      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        filtered = filtered.filter(payout => 
          payout.email?.toLowerCase().includes(term) ||
          payout.iban?.includes(term)
        );
      }

      return filtered;
    }
  },
  methods: {
    async loadPayouts() {
      try {
        const response = await fetch('https://api.axia.quest/api/payouts', {
          credentials: 'include'
        });
        if (response.ok) {
          this.payouts = await response.json();
          this.calculateStats();
        }
      } catch (error) {
        console.error('Erreur lors du chargement des retraits:', error);
      }
    },

    calculateStats() {
      this.stats.total = this.payouts.length;
      this.stats.pending = this.payouts.filter(p => p.status === 'requested').length;
      this.stats.approved = this.payouts.filter(p => p.status === 'approved').length;
      this.stats.totalAmount = this.payouts.reduce((sum, p) => sum + (p.amount_cents / 100), 0).toFixed(2);
    },

    viewPayout(payout) {
      this.selectedPayout = payout;
    },

    async approvePayout(id) {
      if (!confirm('Voulez-vous vraiment approuver ce retrait ?')) return;

      try {
        const response = await fetch(`https://api.axia.quest/api/payouts/${id}/approve`, {
          method: 'POST',
          credentials: 'include'
        });

        if (response.ok) {
          this.loadPayouts();
          this.closeModal();
        }
      } catch (error) {
        console.error('Erreur lors de l\'approbation:', error);
      }
    },

    async markDone(id) {
      if (!confirm('Marquer ce retrait comme effectué ?')) return;
      try {
        const response = await fetch(`https://api.axia.quest/api/payouts/${id}/done`, {
          method: 'POST',
          credentials: 'include'
        });
        if (response.ok) {
          this.loadPayouts();
          this.closeModal();
        }
      } catch (error) {
        console.error('Erreur lors du passage en effectué:', error);
      }
    },

    async rejectPayout(id) {
      if (!confirm('Voulez-vous vraiment rejeter ce retrait ?')) return;

      try {
        const response = await fetch(`https://api.axia.quest/api/payouts/${id}/reject`, {
          method: 'POST',
          credentials: 'include'
        });

        if (response.ok) {
          this.loadPayouts();
          this.closeModal();
        }
      } catch (error) {
        console.error('Erreur lors du rejet:', error);
      }
    },

    closeModal() {
      this.selectedPayout = null;
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleString('fr-FR');
    },

    formatAmount(amountCents) {
      return (amountCents / 100).toFixed(2) + '€';
    },

    maskIBAN(iban) {
      if (!iban) return 'N/A';
      return iban.substring(0, 4) + '****' + iban.substring(iban.length - 4);
    },

    getStatusClass(status) {
      switch (status) {
        case 'requested': return 'bg-warning';
        case 'approved': return 'bg-success';
        case 'rejected': return 'bg-danger';
        case 'done': return 'bg-info';
        default: return 'bg-secondary';
      }
    },
    formatStatus(status) {
      switch (status) {
        case 'requested': return 'En attente';
        case 'approved': return 'Approuvé';
        case 'rejected': return 'Rejeté';
        case 'done': return 'Traité';
        default: return status;
      }
    }
  },
  mounted() {
    this.loadPayouts();
  }
}
</script>

<style scoped>
.payout-management {
  padding: 1.5rem;
}
.stats-inline {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}
.stat-item {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  display: flex;
  gap: 0.5rem;
}
.stat-item .label {
  color: #6c757d;
}
.stat-item .value {
  font-weight: 600;
  color: #2c3e50;
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

.payout-details p {
  margin-bottom: 0.5rem;
}

.notes-text {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  min-height: 60px;
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
  max-width: 700px;
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
</style>
