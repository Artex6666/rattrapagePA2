<template>
  <div class="newsletter-editor card">
    <div class="card-header d-flex align-items-center justify-content-between">
      <h4 class="mb-0">Newsletter</h4>
    </div>
    <div class="card-body">
      <div class="row g-3 align-items-end">
        <div class="col-md-6">
          <label class="form-label">Sujet</label>
          <input v-model="subject" class="form-control" placeholder="Sujet de la campagne" />
        </div>
        <div class="col-md-3">
          <label class="form-label">Planifier (optionnel)</label>
          <input v-model="scheduled_at" type="datetime-local" class="form-control" />
        </div>
        <div class="col-md-3">
          <button class="btn btn-primary w-100" @click="createOrSchedule">
            <i class="fas fa-paper-plane me-1"></i> Créer / Planifier
          </button>
        </div>
        <div class="col-12">
          <label class="form-label">Contenu HTML</label>
          <textarea v-model="body" class="form-control editor" placeholder="<h1>Titre</h1>\n<p>Texte...</p>"></textarea>
        </div>
      </div>

      <hr class="my-4" />

      <div class="table-responsive">
        <table class="table table-striped align-middle">
          <thead>
            <tr>
              <th style="width:80px">ID</th>
              <th>Sujet</th>
              <th style="width:140px">Statut</th>
              <th style="width:220px">Planifiée</th>
              <th style="width:140px">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in rows" :key="c.id">
              <td><span class="badge bg-secondary">#{{ c.id }}</span></td>
              <td class="text-truncate" style="max-width:420px;" :title="c.subject">{{ c.subject }}</td>
              <td>
                <span :class="statusClass(c.status)" class="badge text-uppercase">{{ c.status }}</span>
              </td>
              <td>{{ c.scheduled_at || '—' }}</td>
              <td>
                <button 
                  :class="c.status === 'sent' ? 'btn btn-secondary btn-sm' : 'btn btn-outline-success btn-sm'"
                  @click="send(c.id)" 
                  :disabled="c.status==='sent'"
                >
                  <i class="fas fa-paper-plane me-1"></i> 
                  {{ c.status === 'sent' ? 'Envoyé' : 'Envoyer' }}
                </button>
              </td>
            </tr>
            <tr v-if="rows.length===0">
              <td colspan="5" class="text-center text-muted py-4">Aucune campagne pour le moment</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NewsletterEditor',
  data(){
    return { subject:'', body:'', scheduled_at:'', rows:[] }
  },
  methods:{
    async load(){
      const r = await fetch('https://api.axia.quest/api/newsletter/campaigns',{credentials:'include'});
      this.rows = await r.json();
    },
    async createOrSchedule(){
      await fetch('https://api.axia.quest/api/newsletter/campaigns',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        credentials:'include',
        body: JSON.stringify({ subject:this.subject, body_html:this.body, scheduled_at:this.scheduled_at || null })
      });
      this.subject=''; this.body=''; this.scheduled_at='';
      this.load();
    },
    async send(id){
      await fetch(`https://api.axia.quest/api/newsletter/campaigns/${id}/send`,{method:'POST',credentials:'include'});
      this.load();
    },
    statusClass(status){
      switch(String(status).toLowerCase()){
        case 'draft': return 'bg-secondary';
        case 'scheduled': return 'bg-warning';
        case 'sent': return 'bg-success text-white fw-bold';
        default: return 'bg-info';
      }
    }
  },
  mounted(){ this.load(); }
}
</script>

<style scoped>
.newsletter-editor { overflow: hidden; }
.editor {
  font-family: monospace;
  min-height: 200px;
  width: 100%;
}
</style>
