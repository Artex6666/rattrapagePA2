<template>
  <div class="truck-management">
    <div class="header-section">
      <h2 class="page-title">Gestion des Camions</h2>
      <p class="page-subtitle">Administrez les food trucks et leurs statuts</p>
    </div>

    <!-- Formulaire d'ajout -->
    <div class="card p-4 mb-4">
      <h4>Ajouter un nouveau camion</h4>
      <form @submit.prevent="createTruck" class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Nom du camion</label>
          <input v-model="newTruck.name" type="text" class="form-control" required>
        </div>
        <div class="col-md-4">
          <label class="form-label">Adresse</label>
          <div class="input-group">
            <input v-model="newTruck.address" type="text" class="form-control" required @change="geocodeNewAddress">
            <button type="button" class="btn btn-outline-secondary" @click="geocodeNewAddress">Localiser</button>
          </div>
        </div>
        <div class="col-md-4">
          <label class="form-label">Statut</label>
          <select v-model="newTruck.status" class="form-select" required>
            <option value="1">Actif</option>
            <option value="0">Inactif</option>
            <option value="2">Maintenance</option>
          </select>
        </div>
        <div class="col-12">
          <button type="submit" class="btn btn-primary">Ajouter le camion</button>
        </div>
      </form>
      <div class="mt-3">
        <div id="truck-map-new" class="map-container"></div>
      </div>
    </div>

    <!-- Liste des camions -->
    <div class="card p-4">
      <h4>Liste des camions</h4>
      <div class="table-responsive">
        <table class="table table-striped">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nom</th>
              <th>Adresse</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="truck in trucks" :key="truck.id">
              <td>{{ truck.id }}</td>
              <td>{{ truck.name }}</td>
              <td>{{ truck.address }}</td>
              <td>
                <span :class="getStatusClass(truck.active)" class="badge">
                  {{ statusLabel(truck.active) }}
                </span>
              </td>
              <td>
                <button @click="editTruck(truck)" class="btn btn-sm btn-warning me-2">
                  <i class="fas fa-edit"></i> Modifier
                </button>
                <button @click="deleteTruck(truck.id)" class="btn btn-sm btn-danger">
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
          <h5>Modifier le camion</h5>
          <button @click="closeEdit" class="btn-close"></button>
        </div>
        <div class="modal-body">
          <form @submit.prevent="updateTruck">
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
            <div id="truck-map-edit" class="map-container mb-3"></div>
            <div class="mb-3">
              <label class="form-label">Statut</label>
              <select v-model="editForm.active" class="form-select" required>
                <option :value="1">Actif</option>
                <option :value="0">Inactif</option>
                <option :value="2">Maintenance</option>
              </select>
            </div>
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
  name: 'TruckManagement',
  data() {
    return {
      trucks: [],
      newTruck: {
        name: '',
        address: '',
        lat: null,
        lng: null,
        status: '1'
      },
      editMode: false,
      editForm: {},
      selectedTruck: null,
      truckMapNew: null,
      truckMarkerNew: null,
      truckMapEdit: null,
      truckMarkerEdit: null
    }
  },
  methods: {
    async loadTrucks() {
      try {
        const response = await fetch('https://api.axia.quest/api/trucks/all', {
          credentials: 'include'
        });
        const rows = await response.json();
        this.trucks = rows;
      } catch (error) {
        console.error('Erreur lors du chargement des camions:', error);
      }
    },

    statusLabel(active) {
      const v = Number(active);
      if (v === 1) return 'actif';
      if (v === 2) return 'maintenance';
      return 'inactif';
    },

    async createTruck() {
      try {
        const payload = {
          name: this.newTruck.name,
          address: this.newTruck.address || null,
          lat: this.newTruck.lat || null,
          lng: this.newTruck.lng || null,
          active: Number(this.newTruck.status)
        };
        const response = await fetch('https://api.axia.quest/api/trucks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          this.newTruck = { name: '', address: '', lat: null, lng: null, status: '1' };
          this.loadTrucks();
          if (this.truckMarkerNew && this.truckMapNew) {
            this.truckMapNew.removeLayer(this.truckMarkerNew);
            this.truckMarkerNew = null;
          }
        }
      } catch (error) {
        console.error('Erreur lors de la création:', error);
      }
    },

    editTruck(truck) {
      this.editMode = true;
      this.selectedTruck = truck;
      this.editForm = {
        id: truck.id,
        name: truck.name || '',
        address: truck.address || '',
        lat: truck.lat || null,
        lng: truck.lng || null,
        active: Number(truck.active)
      };
      if (truck.lat && truck.lng) this.$nextTick(async ()=>{ await this.renderEditMap(truck.lat, truck.lng, truck.address); });
    },

    async updateTruck() {
      try {
        const response = await fetch(`https://api.axia.quest/api/trucks/${this.selectedTruck.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify({
            name: this.editForm.name,
            address: this.editForm.address || null,
            lat: this.editForm.lat || null,
            lng: this.editForm.lng || null,
            active: Number(this.editForm.active)
          })
        });

        if (response.ok) {
          this.closeEdit();
          this.loadTrucks();
        }
      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
      }
    },

    async deleteTruck(id) {
      if (!confirm('Voulez-vous vraiment supprimer ce camion ?')) return;

      try {
        const response = await fetch(`https://api.axia.quest/api/trucks/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (response.ok) {
          this.loadTrucks();
        }
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    },

    closeEdit() {
      this.editMode = false;
      this.selectedTruck = null;
      this.editForm = {};
    },

    getStatusClass(active) {
      const v = Number(active);
      switch (v) {
        case 1: return 'bg-success';
        case 2: return 'bg-warning';
        default: return 'bg-secondary';
      }
    },

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
      const coords = await this.geocode(this.newTruck.address);
      if (coords) {
        this.newTruck.lat = coords.lat;
        this.newTruck.lng = coords.lng;
        await this.renderNewMap(coords.lat, coords.lng, this.newTruck.address);
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

    async renderNewMap(lat, lng, label) {
      await this.ensureLeaflet();
      const L = window.L;
      if (!this.truckMapNew) {
        this.truckMapNew = L.map('truck-map-new').setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.truckMapNew);
      } else {
        this.truckMapNew.setView([lat, lng], 14);
      }
      if (this.truckMarkerNew) this.truckMapNew.removeLayer(this.truckMarkerNew);
      this.truckMarkerNew = L.marker([lat, lng]).addTo(this.truckMapNew).bindPopup(label || '').openPopup();
    },

    async renderEditMap(lat, lng, label) {
      await this.ensureLeaflet();
      const L = window.L;
      if (!this.truckMapEdit) {
        this.truckMapEdit = L.map('truck-map-edit').setView([lat, lng], 14);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(this.truckMapEdit);
      } else {
        this.truckMapEdit.setView([lat, lng], 14);
      }
      if (this.truckMarkerEdit) this.truckMapEdit.removeLayer(this.truckMarkerEdit);
      this.truckMarkerEdit = L.marker([lat, lng]).addTo(this.truckMapEdit).bindPopup(label || '').openPopup();
    }
  },
  mounted() {
    this.loadTrucks();
  }
}
</script>

<style scoped>
.truck-management {
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
  max-width: 500px;
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

.map-container { height: 260px; width: 100%; border-radius: 8px; border: 1px solid #dee2e6; }
</style>
