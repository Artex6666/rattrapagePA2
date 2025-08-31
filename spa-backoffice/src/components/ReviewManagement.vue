<template>
  <div class="review-management">
    <div class="header-section">
      <h2 class="page-title">Gestion des Avis</h2>
      <p class="page-subtitle">Modérez les avis des utilisateurs</p>
    </div>

    <!-- Avis en attente -->
    <div class="card p-4 mb-5">
      <h4 class="section-title">Avis en attente</h4>
      <div class="table-responsive">
        <table class="table table-striped align-middle custom-table">
          <thead>
            <tr>
              <th class="table-header">ID</th>
              <th class="table-header">Utilisateur</th>
              <th class="table-header">Note</th>
              <th class="table-header">Commentaire</th>
              <th class="table-header">Date</th>
              <th class="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="review in pendingReviews" :key="review.id" class="table-row">
              <td class="table-cell">{{ review.id }}</td>
              <td class="table-cell">{{ review.first_name }} {{ review.last_name }} ({{ review.email }})</td>
              <td class="table-cell">{{ review.rating }} <i class="fas fa-star text-warning"></i></td>
              <td class="table-cell">{{ review.comment }}</td>
              <td class="table-cell">{{ formatDate(review.created_at) }}</td>
              <td class="table-cell">
                <button @click="approveReview(review.id)" class="btn btn-sm btn-success me-2">
                  <i class="fas fa-check"></i> Publier
                </button>
                <button @click="deleteReview(review.id)" class="btn btn-sm btn-danger">
                  <i class="fas fa-trash"></i> Supprimer
                </button>
              </td>
            </tr>
            <tr v-if="pendingReviews.length === 0">
              <td colspan="6" class="text-center text-muted">Aucun avis en attente</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Avis vérifiés -->
    <div class="card p-4">
      <h4 class="section-title">Avis vérifiés</h4>
      <div class="table-responsive">
        <table class="table table-striped align-middle custom-table">
          <thead>
            <tr>
              <th class="table-header">ID</th>
              <th class="table-header">Utilisateur</th>
              <th class="table-header">Note</th>
              <th class="table-header">Commentaire</th>
              <th class="table-header">Date</th>
              <th class="table-header">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="review in approvedReviews" :key="review.id" class="table-row">
              <td class="table-cell">{{ review.id }}</td>
              <td class="table-cell">{{ review.first_name }} {{ review.last_name }} ({{ review.email }})</td>
              <td class="table-cell">{{ review.rating }} <i class="fas fa-star text-warning"></i></td>
              <td class="table-cell">{{ review.comment }}</td>
              <td class="table-cell">{{ formatDate(review.created_at) }}</td>
              <td class="table-cell">
                <button @click="deleteReview(review.id)" class="btn btn-sm btn-danger">
                  <i class="fas fa-trash"></i> Supprimer
                </button>
              </td>
            </tr>
            <tr v-if="approvedReviews.length === 0">
              <td colspan="6" class="text-center text-muted">Aucun avis vérifié</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ReviewManagement',
  data() {
    return {
      reviews: []
    }
  },
  computed: {
    pendingReviews() {
      console.log('Computing pendingReviews from:', this.reviews)
      return this.reviews.filter(review => review.status === 'pending')
    },
    approvedReviews() {
      console.log('Computing approvedReviews from:', this.reviews)
      return this.reviews.filter(review => review.status === 'approved')
    }
  },
  methods: {
    async loadReviews() {
      try {
        console.log('Chargement des avis...')
        const response = await fetch('https://api.axia.quest/api/reviews', {
          credentials: 'include'
        })
        console.log('Response status:', response.status)
        console.log('Response headers:', response.headers)
        
        if (response.ok) {
          this.reviews = await response.json()
          console.log('Avis chargés:', this.reviews)
        } else {
          const errorText = await response.text()
          console.error('Erreur lors du chargement des avis:', response.status, errorText)
        }
      } catch (error) {
        console.error('Erreur:', error)
      }
    },
    async approveReview(id) {
      try {
        const response = await fetch(`https://api.axia.quest/api/reviews/${id}/approve`, {
          method: 'POST',
          credentials: 'include'
        })
        if (response.ok) {
          await this.loadReviews()
        } else {
          console.error('Erreur lors de la publication')
        }
      } catch (error) {
        console.error('Erreur:', error)
      }
    },
    async deleteReview(id) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) {
        try {
                  const response = await fetch(`https://api.axia.quest/api/reviews/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        })
          if (response.ok) {
            await this.loadReviews()
          } else {
            console.error('Erreur lors de la suppression')
          }
        } catch (error) {
          console.error('Erreur:', error)
        }
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  },
  mounted() {
    console.log('ReviewManagement component mounted')
    this.loadReviews()
  }
}
</script>

<style scoped>
.review-management {
  padding: 20px;
}

.header-section {
  margin-bottom: 30px;
}

.page-title {
  color: #2c3e50;
  margin-bottom: 10px;
  font-weight: 600;
}

.page-subtitle {
  color: #7f8c8d;
  margin: 0;
}

.section-title {
  color: #34495e;
  margin-bottom: 20px;
  font-weight: 500;
}

.custom-table {
  margin-bottom: 0;
}

.table-header {
  background-color: #f8f9fa;
  border-bottom: 2px solid #dee2e6;
  color: #495057;
  font-weight: 600;
  padding: 12px 8px;
}

.table-row:hover {
  background-color: #f8f9fa;
}

.table-cell {
  padding: 12px 8px;
  vertical-align: middle;
}

.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}

.card {
  border: none;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border-radius: 0.5rem;
}
</style>


