<template>
  <div class="warehouse-management">
    <div class="header-section">
      <h2 class="page-title">Gestion des Entrepôts</h2>
      <p class="page-subtitle">Administrez les entrepôts et leurs localisations</p>
    </div>

    <!-- Formulaire d'ajout -->
    <div class="card p-4 mb-4">
      <h4>Ajouter un nouvel entrepôt</h4>
      <form @submit.prevent="createWarehouse" class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Nom de l'entrepôt</label>
          <input v-model="newWarehouse.name" type="text" class="form-control" required>
        </div>
        <div class="col-md-6">
          <label class="form-label">Adresse</label>
          <div class="input-group">
            <input v-model="newWarehouse.address" type="text" class="form-control" required @change="geocodeNewAddress">
            <button type="button" class="btn btn-outline-secondary" @click="geocodeNewAddress">Localiser</button>
          </div>
        </div>
        <div class="col-12">
          <button type="submit" class="btn btn-primary">Ajouter l'entrepôt</button>
        </div>
      </form>
      <div class="mt-3">
        <div id="wh-map-new" class="map-container"></div>
      </div>
    </div>

    <!-- Liste des entrepôts -->
    <div class="card p-4">
      <h4>Liste des entrepôts</h4>
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Adresse</th>
              
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="warehouse in warehouses" :key="warehouse.id">
              <td>{{ warehouse.id }}</td>
              <td>{{ warehouse.name }}</td>
              <td>{{ warehouse.address }}</td>
              <td>
                <button @click="editWarehouse(warehouse)" class="btn btn-sm btn-warning me-2">
                  <i class="fas fa-edit"></i> Modifier
                </button>
                <button @click="deleteWarehouse(warehouse.id)" class="btn btn-sm btn-danger">
                  <i class="fas fa-trash"></i> Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal d'édition -->
    <div v-if="editMode" class="modal-overlay" @click="closeEdit">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h5>Modifier l'entrepôt</h5>
          <button @click="closeEdit" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateWarehouse">
            <div class="mb-3">
              <label class="form-label">Nom</label>
              <input v-model="editForm.name" type="text" class="form-control" required>
            </div>
            <div class="mb-3">
              <label class="form-label">Adresse</label>
              <div class="input-group">
                <input v-model="editForm.address" type="text" class="form-control" required @change="geocodeEditAddress">
                <button type="button" class="btn btn-outline-secondary" @click="geocodeEditAddress">Localiser</button>
              </div>
            </div>
            <div id="wh-map-edit" class="map-container mb-3"></div>
            <div class="text-end">
              <button type="button" @click="closeEdit" class="btn btn-secondary me-2">Annuler</button>
              <button type="submit" class="btn btn-primary">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'WarehouseManagement',
  data() {
    return {
      warehouses: [],
      newWarehouse: {
        name: '',
        address: '',
        lat: null,
        lng: null
      },
      editMode: false,
      editForm: {},
      selectedWarehouse: null
    }
  },
  methods: {
    ensureLeaflet() {
      return new Promise((resolve) => {
        if (window.L) return resolve();
        // Inject CSS once
        if (!document.getElementById('leaflet-css')) {
          const link = document.createElement('link');
          link.id = 'leaflet-css';
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }
        // Inject script once
        if (document.getElementById('leaflet-js')) {
          const s = document.getElementById('leaflet-js');
          if (window.L) return resolve();
          s.addEventListener('load', () => resolve());
          return;
        }
        const script = document.createElement('script');
        script.id = 'leaflet-js';
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => resolve();
        document.body.appendChild(script);
      });
    },
    async geocode(address) {
      if (!address) return null;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`);
        const j = await res.json();
        if (Array.isArray(j) && j.length) {
          const { lat, lon } = j[0];
          return { lat: parseFloat(lat), lng: parseFloat(lon) };
        }
      } catch (e) { console.warn('geocode fail', e); }
      return null;
    },
    async geocodeNewAddress() {
      const coords = await this.geocode(this.newWarehouse.address);
      if (coords) {
        this.newWarehouse.lat = coords.lat;
        this.newWarehouse.lng = coords.lng;
        await this.renderNewMap(coords.lat, coords.lng, this.newWarehouse.address);
      }
    },
    async geocodeEditAddress() {
      const coords = await this.geocode(this.editForm.address);
      if (coords) {
        this.editForm.lat = coords.lat;
        this.editForm.lng = coords.lng;
        await this.renderEditMap(coords.lat, coords.lng, this.editForm.address);
      }
    },
    async loadWarehouses() {
      try {
        const response = await fetch('https://api.axia.quest/api/warehouses', {
          credentials: 'include'
        });
        this.warehouses = await response.json();
      } catch (error) {
        console.error('Erreur lors du chargement des entrepôts:', error);
      }
    },

    async createWarehouse() {
      try {
        // Si lat/lng ne sont pas déjà définis, tenter un géocodage automatique
        if (!this.newWarehouse.lat || !this.newWarehouse.lng) {
          const coords = await this.geocode(this.newWarehouse.address);
          if (!coords) {
            alert("Impossible de localiser l'adresse. Cliquez sur Localiser ou vérifiez l'adresse.");
            return;
          }
          this.newWarehouse.lat = coords.lat;
          this.newWarehouse.lng = coords.lng;
        }

        const response = await fetch('https://api.axia.quest/api/warehouses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(this.newWarehouse)
        });

        if (response.ok) {
          this.newWarehouse = { name: '', address: '', lat: null, lng: null };
          this.loadWarehouses();
        }
      } catch (error) {
        console.error('Erreur lors de la création:', error);
      }
    },

    editWarehouse(warehouse) {
      this.editMode = true;
      this.selectedWarehouse = warehouse;
      this.editForm = { ...warehouse };
      if (warehouse.lat && warehouse.lng) this.$nextTick(async ()=>{ await this.renderEditMap(warehouse.lat, warehouse.lng, warehouse.address); });
    },

    async updateWarehouse() {
      try {
        const response = await fetch(`https://api.axia.quest/api/warehouses/${this.selectedWarehouse.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({ name: this.editForm.name, address: this.editForm.address, lat: this.editForm.lat || null, lng: this.editForm.lng || null })
        });

        if (response.ok) {
          this.closeEdit();
          this.loadWarehouses();
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
      }
    },

    async deleteWarehouse(id) {
      if (!confirm('Voulez-vous vraiment supprimer cet entrepôt ?')) return;

      try {
        const response = await fetch(`https://api.axia.quest/api/warehouses/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          this.loadWarehouses();
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    },

    closeEdit() {
      this.editMode = false;
      this.selectedWarehouse = null;
      this.editForm = {};
    },
    async renderNewMap(lat, lng, label) {
      await this.ensureLeaflet();
      const L = window.L;
      if (!this._mapNew) {
        this._mapNew = L.map('wh-map-new').setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this._mapNew);
      } else {
        this._mapNew.setView([lat, lng], 14);
      }
      if (this._markerNew) this._mapNew.removeLayer(this._markerNew);
      this._markerNew = L.marker([lat, lng]).addTo(this._mapNew).bindPopup(label || '').openPopup();
    },
    async renderEditMap(lat, lng, label) {
      await this.ensureLeaflet();
      const L = window.L;
      if (!this._mapEdit) {
        this._mapEdit = L.map('wh-map-edit').setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this._mapEdit);
      } else {
        this._mapEdit.setView([lat, lng], 14);
      }
      if (this._markerEdit) this._mapEdit.removeLayer(this._markerEdit);
      this._markerEdit = L.marker([lat, lng]).addTo(this._mapEdit).bindPopup(label || '').openPopup();
    }

  },
  mounted() {
    this.loadWarehouses();
  }
}
</script>

<style scoped>
.map-container { height: 260px; width: 100%; border-radius: 8px; border: 1px solid #dee2e6; }
.warehouse-management {
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
  max-width: 600px;
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
