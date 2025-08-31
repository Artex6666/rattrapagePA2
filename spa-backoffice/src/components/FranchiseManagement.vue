<template>
  <div class="franchise-management">
    <div class="header-section">
      <h2 class="page-title">Gestion des Franchisés</h2>
      <p class="page-subtitle">Consultez et gérez les franchisés actifs</p>
    </div>

    <!-- Candidatures en attente -->
    <div class="card p-4 mb-5">
      <h4 class="section-title">Candidatures en attente</h4>
      <div class="table-responsive">
        <table class="table table-striped align-middle custom-table">
          <thead>
            <tr>
              <th class="table-header">ID</th>
              <th class="table-header">Nom</th>
              <th class="table-header">Email</th>
              <th class="table-header">SIRET</th>
              <th class="table-header">Date de candidature</th>
              <th class="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="pending in pendingApplications" :key="pending.id" class="table-row">
              <td class="table-cell">{{ pending.id }}</td>
              <td class="table-cell">{{ pending.applicant_name }}</td>
              <td class="table-cell">{{ pending.email }}</td>
              <td class="table-cell">{{ pending.siret }}</td>
              <td class="table-cell">{{ formatDate(pending.created_at) }}</td>
              <td class="table-cell">
                <button @click="viewPendingApplication(pending)" class="btn btn-sm btn-info me-2">
                  <i class="fas fa-eye"></i> Voir
                </button>
                <button @click="approveApplication(pending.id)" class="btn btn-sm btn-success me-2">
                  <i class="fas fa-check"></i> Approuver
                </button>
                <button @click="openRejectFromList(pending)" class="btn btn-sm btn-danger">
                  <i class="fas fa-times"></i> Rejeter
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Franchisés validés -->
    <div class="card p-4">
      <h4 class="section-title">Franchisés validés</h4>
      <div class="table-responsive">
        <table class="table table-striped align-middle custom-table">
          <thead>
            <tr>
              <th class="table-header">ID</th>
              <th class="table-header">Nom</th>
              <th class="table-header">Email</th>
              <th class="table-header">SIRET</th>
              <th class="table-header">Date d'approbation</th>
              <th class="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="franchise in validatedFranchises" :key="franchise.id" class="table-row">
              <td class="table-cell">{{ franchise.id }}</td>
              <td class="table-cell">{{ franchise.applicant_name }}</td>
              <td class="table-cell">{{ franchise.email }}</td>
              <td class="table-cell">{{ franchise.siret }}</td>
              <td class="table-cell">{{ formatDate(franchise.updated_at || franchise.created_at) }}</td>
              <td class="table-cell">
                <button @click="viewFranchise(franchise)" class="btn btn-sm btn-info me-2">
                  <i class="fas fa-eye"></i> Voir
                </button>
                <button @click="convertToMember(franchise.id)" class="btn btn-sm btn-warning">
                  <i class="fas fa-user"></i> Repasser membre
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de visualisation du franchisé -->
    <div v-if="selectedFranchise" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop style="max-width: 1000px; width: 95%">
        <div class="modal-header">
          <h5>Détails du franchisé #{{ selectedFranchise.id }}</h5>
          <button @click="closeModal" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <div class="franchise-details">
            <div class="row g-3">
              <div class="col-md-6">
                <p><strong>Nom du franchisé:</strong> {{ selectedFranchise.applicant_name }}</p>
                <p><strong>Email:</strong> {{ selectedFranchise.email }}</p>
                <p><strong>Téléphone:</strong> {{ selectedFranchise.phone || 'Non renseigné' }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>SIRET:</strong> {{ selectedFranchise.siret }}</p>
                <p><strong>Numéro de TVA:</strong> {{ selectedFranchise.tva_number || 'Non renseigné' }}</p>
                <p><strong>Date d'approbation:</strong> {{ formatDate(selectedFranchise.updated_at || selectedFranchise.created_at) }}</p>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-12">
                <p><strong>Documents:</strong></p>
                <div v-if="selectedFranchise.documents && selectedFranchise.documents.length > 0">
                  <div v-for="doc in selectedFranchise.documents" :key="doc.id" class="document-item">
                    <a :href="doc.url" target="_blank" class="btn btn-sm btn-outline-primary me-2">
                      <i class="fas fa-download"></i> {{ doc.name }}
                    </a>
                  </div>
                </div>
                <div v-else class="text-muted">Aucun document joint</div>
              </div>
            </div>
            <div class="row mt-4">
              <div class="col-12 d-flex gap-2 flex-wrap">
                <button @click="convertToMember(selectedFranchise.id)" class="btn btn-warning">
                  <i class="fas fa-user"></i> Repasser membre
                </button>
                <button class="btn btn-secondary" @click="closeModal">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de visualisation de la candidature en attente -->
    <div v-if="selectedPendingApplication" class="modal-overlay" @click="closePendingModal">
      <div class="modal-content" @click.stop style="max-width: 1000px; width: 95%">
        <div class="modal-header">
          <h5>Détails de la candidature #{{ selectedPendingApplication.id }}</h5>
          <button @click="closePendingModal" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <div class="application-details">
            <div class="row g-3">
              <div class="col-md-6">
                <p><strong>Nom du candidat:</strong> {{ selectedPendingApplication.applicant_name }}</p>
                <p><strong>Email:</strong> {{ selectedPendingApplication.email }}</p>
                <p><strong>Téléphone:</strong> {{ selectedPendingApplication.phone || 'Non renseigné' }}</p>
              </div>
              <div class="col-md-6">
                <p><strong>SIRET:</strong> {{ selectedPendingApplication.siret }}</p>
                <p><strong>Numéro de TVA:</strong> {{ selectedPendingApplication.tva_number || 'Non renseigné' }}</p>
                <p><strong>Statut:</strong> 
                  <span class="badge bg-warning">En attente</span>
                </p>
              </div>
            </div>
            <div class="row mt-3">
              <div class="col-12">
                <p><strong>Documents:</strong></p>
                <div v-if="selectedPendingApplication.documents && selectedPendingApplication.documents.length > 0">
                  <div v-for="doc in selectedPendingApplication.documents" :key="doc.id" class="document-item">
                    <a :href="doc.url" target="_blank" class="btn btn-sm btn-outline-primary me-2">
                      <i class="fas fa-download"></i> {{ doc.name }}
                    </a>
                  </div>
                </div>
                <div v-else class="text-muted">Aucun document joint</div>
              </div>
            </div>
            <div class="row mt-4">
              <div class="col-12 d-flex gap-2 flex-wrap">
                <button @click="approveApplication(selectedPendingApplication.id)" class="btn btn-success">
                  <i class="fas fa-check"></i> Approuver
                </button>
                <button @click="openReject" class="btn btn-danger">
                  <i class="fas fa-times"></i> Rejeter
                </button>
                <button class="btn btn-secondary" @click="closePendingModal">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal de refus avec message - SÉPARÉ du modal de détails -->
    <div v-if="showRejectModal" class="modal-overlay" @click="closeRejectModal">
      <div class="modal-content reject-modal" @click.stop>
        <div class="modal-header">
          <h5>Motif du refus</h5>
          <button @click="closeRejectModal" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Raison du refus :</label>
            <textarea 
              v-model="rejectMessage" 
              class="form-control reject-textarea" 
              rows="8" 
              placeholder="Expliquez pourquoi la candidature est rejetée..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeRejectModal" class="btn btn-secondary">Annuler</button>
          <button @click="confirmReject" class="btn btn-danger">Rejeter</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FranchiseManagement',
  data() {
    return {
      pendingApplications: [],
      validatedFranchises: [],
      selectedFranchise: null,
      selectedPendingApplication: null,
      rejectMessage: '',
      showRejectModal: false
    }
  },
  methods: {

    async loadData() {
      await Promise.all([
        this.loadPendingApplications(),
        this.loadValidatedFranchises()
      ]);
    },

    async loadPendingApplications() {
      try {
        const response = await fetch('https://api.axia.quest/api/franchises/pending', {
          credentials: 'include'
        });
        if (response.ok) {
          this.pendingApplications = await response.json();
        }
      } catch (error) {
        console.error('Erreur lors du chargement des candidatures en attente:', error);
      }
    },

    async loadValidatedFranchises() {
      try {
        const response = await fetch('https://api.axia.quest/api/franchises/validated', {
          credentials: 'include'
        });
        if (response.ok) {
          this.validatedFranchises = await response.json();
        }
      } catch (error) {
        console.error('Erreur lors du chargement des franchisés validés:', error);
      }
    },

    viewFranchise(franchise) {
      this.selectedFranchise = franchise;
    },

    viewPendingApplication(application) {
      this.selectedPendingApplication = application;
    },

    async approveApplication(id) {
      if (!confirm('Voulez-vous vraiment approuver cette candidature ?')) return;

      try {
        const response = await fetch(`https://api.axia.quest/api/franchises/applications/${id}/approve`, {
          method: 'POST',
          credentials: 'include'
        });

        if (response.ok) {
          this.loadData();
          this.closePendingModal();
        } else {
          const error = await response.json();
          alert('Erreur lors de l\'approbation: ' + (error.message || 'Erreur inconnue'));
        }
      } catch (error) {
        console.error('Erreur lors de l\'approbation:', error);
        alert('Erreur lors de l\'approbation: ' + error.message);
      }
    },

    async convertToMember(id) {
      if (!confirm('Voulez-vous vraiment convertir ce franchisé en membre ? Cela libérera tous ses camions.')) return;

      try {
        const response = await fetch(`https://api.axia.quest/api/franchises/${id}/convert-to-member`, {
          method: 'POST',
          credentials: 'include'
        });

        if (response.ok) {
          this.loadData();
          this.closeModal();
          alert('Franchisé converti en membre avec succès. Ses camions ont été libérés.');
        } else {
          const error = await response.json();
          alert('Erreur lors de la conversion: ' + (error.message || 'Erreur inconnue'));
        }
      } catch (error) {
        console.error('Erreur lors de la conversion:', error);
        alert('Erreur lors de la conversion: ' + error.message);
      }
    },

    async rejectApplication(message) {
      const id = this.rejectApplicationId || this.selectedApplication?.id;
      try {
        const response = await fetch(`https://api.axia.quest/api/franchises/applications/${id}/reject`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ message: message || '' })
        });
        if (response.ok) {
          this.loadData();
          this.showRejectModal = false;
          this.rejectMessage = '';
          this.closeModal();
          this.closePendingModal();
        }
      } catch (error) {
        console.error('Erreur lors du rejet:', error);
      }
    },

    openReject() { 
      this.showRejectModal = true;
    },
    openRejectFromList(application) { 
      this.rejectApplicationId = application.id; 
      this.showRejectModal = true;
    },
    async confirmReject() { 
      await this.rejectApplication(); 
    },

    closeModal() {
      this.selectedFranchise = null;
    },
    closePendingModal() {
      this.selectedPendingApplication = null;
    },
    closeRejectModal() {
      this.showRejectModal = false;
      this.rejectMessage = '';
    },

    formatDate(dateString) {
      return new Date(dateString).toLocaleString('fr-FR');
    },


  },
  mounted() {
    this.loadData();
  }
}
</script>

<style scoped>
.franchise-management {
  padding: 2rem;
}

.header-section {
  text-align: center;
  margin-bottom: 3rem;
}

.page-title {
  color: #2c3e50;
  font-size: 2.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.page-subtitle {
  color: #6c757d;
  font-size: 1.1rem;
  margin-bottom: 0;
}

.franchise-details p,
.application-details p {
  margin-bottom: 0.5rem;
}

.document-item {
  margin-bottom: 0.5rem;
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

.reject-modal {
  max-width: 700px;
  width: 95%;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.reject-modal .modal-header {
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  padding: 1.5rem;
}

.reject-modal .modal-header h5 {
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
}

.reject-modal .modal-body {
  padding: 2rem;
}

.reject-modal .form-group {
  margin-bottom: 0;
}

.reject-modal .form-label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 500;
  color: #495057;
  font-size: 1rem;
}

.reject-textarea {
  width: 100%;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 1rem;
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.reject-textarea:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}

.reject-modal .modal-footer {
  background: #f8f9fa;
  border-top: 1px solid #dee2e6;
  padding: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.reject-modal .btn {
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.reject-modal .btn-secondary {
  background: #6c757d;
  border: none;
  color: white;
}

.reject-modal .btn-secondary:hover {
  background: #5a6268;
  transform: translateY(-1px);
}

.reject-modal .btn-danger {
  background: #dc3545;
  border: none;
  color: white;
}

.reject-modal .btn-danger:hover {
  background: #c82333;
  transform: translateY(-1px);
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

.section-title {
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #e9ecef;
}

.custom-table {
  margin-bottom: 0;
}

.table-header {
  background-color: #f8f9fa;
  color:rgb(255, 255, 255);
  font-weight: 600;
  padding: 1rem 0.75rem;
  border-bottom: 2px solid #dee2e6;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-row {
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.table-cell {
  padding: 1rem 0.75rem;
  vertical-align: middle;
  border-bottom: 1px solid #e9ecef;
}

.card {
  border: none;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.table-responsive {
  border-radius: 8px;
  overflow: hidden;
}
</style>
