<template>
  <div class="order-management">
    <div class="header-section">
      <h2 class="page-title">Gestion des Commandes</h2>
      <p class="page-subtitle">Suivez et gérez toutes les commandes des clients</p>
    </div>

    <!-- Filtres -->
    <div class="card p-4 mb-4">
      <div class="row g-3">
        <div class="col-md-3">
          <label class="form-label">Statut</label>
          <select v-model="filterStatus" class="form-select">
            <option value="">Tous les statuts</option>
            <option value="en_attente">En attente</option>
            <option value="confirmée">Confirmée</option>
            <option value="en_préparation">En préparation</option>
            <option value="prête">Prête</option>
            <option value="livrée">Livrée</option>
            <option value="annulée">Annulée</option>
          </select>
        </div>
        <div class="col-md-3">
          <label class="form-label">Date de début</label>
          <input v-model="filterStartDate" type="date" class="form-control">
        </div>
        <div class="col-md-3">
          <label class="form-label">Date de fin</label>
          <input v-model="filterEndDate" type="date" class="form-control">
        </div>
        <div class="col-md-3">
          <label class="form-label">&nbsp;</label>
          <button @click="loadOrders" class="btn btn-primary w-100">Actualiser</button>
        </div>
      </div>
    </div>

    <!-- Statistiques -->
    <div class="row mb-4">
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-number">{{ stats.total }}</div>
          <div class="stat-label">Total des commandes</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-number">{{ stats.pending }}</div>
          <div class="stat-label">En attente</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-number">{{ stats.delivered }}</div>
          <div class="stat-label">Livrées</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="stat-card">
          <div class="stat-number">{{ stats.totalRevenue }}€</div>
          <div class="stat-label">Chiffre d'affaires</div>
        </div>
      </div>
    </div>

    <!-- Liste des commandes -->
    <div class="card p-4">
      <h4>Liste des commandes</h4>
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Email</th>
              <th>Montant</th>
              <th>Points gagnés</th>
              <th>Statut</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in filteredOrders" :key="order.id">
              <td>{{ order.id }}</td>
              <td>{{ order.user_name || 'N/A' }}</td>
              <td>{{ order.email }}</td>
              <td>{{ formatAmount(order.amount_cents) }}</td>
              <td>{{ order.loyalty_points || 0 }}</td>
              <td>
                <span :class="getStatusClass(order.status)" class="badge">
                  {{ order.status }}
                </span>
              </td>
              <td>{{ formatDate(order.created_at) }}</td>
              <td>
                <button @click="viewOrder(order)" class="btn btn-sm btn-info me-2">
                  <i class="fas fa-eye"></i> Voir
                </button>
                <button v-if="order.status === 'en_attente'" @click="confirmOrder(order.id)" class="btn btn-sm btn-success me-2">
                  <i class="fas fa-check"></i> Confirmer
                </button>
                <button v-if="order.status === 'confirmée'" @click="prepareOrder(order.id)" class="btn btn-sm btn-warning me-2">
                  <i class="fas fa-utensils"></i> Préparer
                </button>
                <button v-if="order.status === 'prête'" @click="deliverOrder(order.id)" class="btn btn-sm btn-primary">
                  <i class="fas fa-truck"></i> Livrer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de visualisation -->
    <div v-if="selectedOrder" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5>Détails de la commande #{{ selectedOrder.id }}</h5>
          <button @click="closeModal" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <div class="order-details">
            <div class="row">
              <div class="col-md-6">
                <p><strong>Client:</strong> {{ selectedOrder.user_name || 'N/A' }}</p>
                <p><strong>Email:</strong> {{ selectedOrder.email }}</p>
                <p><strong>Téléphone:</strong> {{ selectedOrder.phone || 'Non renseigné' }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>Montant:</strong> {{ formatAmount(selectedOrder.amount_cents) }}</p>
                <p><strong>Points gagnés:</strong> {{ selectedOrder.loyalty_points || 0 }}</p>
                <p><strong>Statut:</strong> 
                  <span :class="getStatusClass(selectedOrder.status)" class="badge">
                    {{ selectedOrder.status }}
                  </span>
                </p>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-12">
                <p><strong>Adresse de livraison:</strong></p>
                <div class="address-text">
                  {{ selectedOrder.delivery_address || 'Non renseignée' }}
                </div>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-12">
                <p><strong>Détails de la commande:</strong></p>
                <div class="order-items">
                  <div v-if="selectedOrder.items && selectedOrder.items.length > 0">
                    <div v-for="item in selectedOrder.items" :key="item.id" class="order-item">
                      <span class="item-name">{{ item.name }}</span>
                      <span class="item-quantity">x{{ item.quantity }}</span>
                      <span class="item-price">{{ formatAmount(item.price_cents) }}</span>
                    </div>
                  </div>
                  <div v-else class="text-muted">Aucun détail disponible</div>
                </div>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-12">
                <p><strong>Notes:</strong></p>
                <div class="notes-text">{{ selectedOrder.notes || 'Aucune note' }}</div>
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
  name: 'OrderManagement',
  data() {
    return {
      orders: [],
      selectedOrder: null,
      filterStatus: '',
      filterStartDate: '',
      filterEndDate: '',
      stats: {
        total: 0,
        pending: 0,
        delivered: 0,
        totalRevenue: 0
      }
    }
  },
  computed: {
    filteredOrders() {
      let filtered = this.orders;

      if (this.filterStatus) {
        filtered = filtered.filter(order => order.status === this.filterStatus);
      }

      if (this.filterStartDate) {
        filtered = filtered.filter(order => new Date(order.created_at) >= new Date(this.filterStartDate));
      }

      if (this.filterEndDate) {
        filtered = filtered.filter(order => new Date(order.created_at) <= new Date(this.filterEndDate));
      }

      return filtered;
    }
  },
  methods: {
    async loadOrders() {
      try {
        const response = await fetch('https://api.axia.quest/api/orders', {
          credentials: 'include'
        });
        if (response.ok) {
          this.orders = await response.json();
          this.calculateStats();
        }
      } catch (error) {
        console.error('Erreur lors du chargement des commandes:', error);
      }
    },

    calculateStats() {
      this.stats.total = this.orders.length;
      this.stats.pending = this.orders.filter(o => o.status === 'en_attente').length;
      this.stats.delivered = this.orders.filter(o => o.status === 'livrée').length;
      this.stats.totalRevenue = this.orders.reduce((sum, o) => sum + (o.amount_cents / 100), 0).toFixed(2);
    },

    viewOrder(order) {
      this.selectedOrder = order;
    },

    async confirmOrder(id) {
      if (!confirm('Voulez-vous vraiment confirmer cette commande ?')) return;

      try {
        const response = await fetch(`https://api.axia.quest/api/orders/${id}/confirm`, {
          method: 'POST',
          credentials: 'include'
        });

        if (response.ok) {
          this.loadOrders();
          this.closeModal();
        }
      } catch (error) {
        console.error('Erreur lors de la confirmation:', error);
      }
    },

    async prepareOrder(id) {
      if (!confirm('Voulez-vous marquer cette commande comme en préparation ?')) return;

      try {
        const response = await fetch(`https://api.axia.quest/api/orders/${id}/prepare`, {
          method: 'POST',
          credentials: 'include'
        });

        if (response.ok) {
          this.loadOrders();
          this.closeModal();
        }
      } catch (error) {
        console.error('Erreur lors de la mise en préparation:', error);
      }
    },

    async deliverOrder(id) {
      if (!confirm('Voulez-vous marquer cette commande comme livrée ?')) return;

      try {
        const response = await fetch(`https://api.axia.quest/api/orders/${id}/deliver`, {
          method: 'POST',
          credentials: 'include'
        });

        if (response.ok) {
          this.loadOrders();
          this.closeModal();
        }
      } catch (error) {
        console.error('Erreur lors de la livraison:', error);
      }
    },

    closeModal() {
      this.selectedOrder = null;
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleString('fr-FR');
    },

    formatAmount(amountCents) {
      return (amountCents / 100).toFixed(2) + '€';
    },

    getStatusClass(status) {
      switch (status) {
        case 'en_attente': return 'bg-warning';
        case 'confirmée': return 'bg-info';
        case 'en_préparation': return 'bg-warning';
        case 'prête': return 'bg-success';
        case 'livrée': return 'bg-primary';
        case 'annulée': return 'bg-danger';
        default: return 'bg-secondary';
      }
    }
  },
  mounted() {
    this.loadOrders();
  }
}
</script>

<style scoped>
.order-management {
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

.order-details p {
  margin-bottom: 0.5rem;
}

.address-text {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  min-height: 60px;
}

.order-items {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.order-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid #dee2e6;
}

.order-item:last-child {
  border-bottom: none;
}

.item-name {
  flex: 1;
  font-weight: 500;
}

.item-quantity {
  margin: 0 1rem;
  color: #6c757d;
}

.item-price {
  font-weight: 600;
  color: #2c3e50;
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
  max-width: 800px;
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
