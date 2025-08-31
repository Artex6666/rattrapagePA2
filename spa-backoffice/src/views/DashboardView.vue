<template>
  <div class="dashboard">
    <h1>Dashboard Driv'n Cook</h1>

    <div class="stats">
      <div class="stat">
        <h3>{{ stats.users?.clients || 0 }}</h3>
        <p>Clients</p>
      </div>
      <div class="stat">
        <h3>{{ stats.users?.franchisees || 0 }}</h3>
        <p>Franchisés</p>
      </div>
      <div class="stat">
        <h3>{{ stats.trucks?.total || 0 }}</h3>
        <p>Camions ({{ stats.trucks?.assigned || 0 }} assignés)</p>
      </div>
      <div class="stat">
        <h3>{{ stats.orders?.total || 0 }}</h3>
        <p>Commandes totales</p>
      </div>
      <div class="stat">
        <h3>{{ stats.orders?.pending || 0 }}</h3>
        <p>En attente</p>
      </div>
      <div class="stat">
        <h3>{{ stats.orders?.ready || 0 }}</h3>
        <p>Prêtes</p>
      </div>
      <div class="stat">
        <h3>{{ stats.orders?.completed || 0 }}</h3>
        <p>Complétées</p>
      </div>
      <div class="stat">
        <h3>{{ formatCurrency(stats.revenue_eur) }}</h3>
        <p>Chiffre d'affaires</p>
      </div>
      <div class="stat">
        <h3>{{ stats.payouts?.requested || 0 }}</h3>
        <p>Retraits en attente</p>
      </div>
      <div class="stat">
        <h3>{{ formatCurrency(stats.payouts?.amount_eur) }}</h3>
        <p>Montant retraits</p>
      </div>
    </div>

    <div class="chart-section">
      <h2>Commandes par Foodtruck</h2>
      <div class="chart-container">
        <canvas id="ordersByTruckChart"></canvas>
      </div>
    </div>

    <div class="chart-section">
      <h2>Temps de préparation (secondes)</h2>
      <div style="display:flex; gap:8px; margin-bottom:8px; align-items:center;">
        <label>Tri:</label>
        <button @click="setPrepSort('asc')" :class="{ active: prepSort==='asc' }">Croissant</button>
        <button @click="setPrepSort('desc')" :class="{ active: prepSort==='desc' }">Décroissant</button>
        <button @click="setPrepSort('none')" :class="{ active: prepSort==='none' }">Aucun</button>
      </div>
      <div class="chart-container">
        <canvas id="prepTimesChart"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { markRaw } from 'vue';

export default {
  name: "DashboardView",
  data() {
    return {
      stats: {},
      ordersChart: null,
      prepTimes: [],
      prepSort: 'desc',
      prepChart: null
    }
  },
  methods: {
    formatCurrency(value) {
      if (value == null || value === 0) return '0,00€';
      return Number(value).toLocaleString('fr-FR', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      }) + '€';
    },
    formatHms(totalSeconds) {
      const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      const parts = [];
      if (h > 0) parts.push(`${h}h`);
      if (m > 0 || h > 0) parts.push(`${h > 0 ? String(m).padStart(2, '0') : m}m`);
      parts.push(`${(h > 0 || m > 0) ? String(sec).padStart(2, '0') : sec}s`);
      return parts.join(' ');
    },
    ensureChartJs() {
      return new Promise((resolve) => {
        if (window.Chart) return resolve();
        const existing = document.getElementById('chartjs-cdn');
        if (existing) {
          if (window.Chart) return resolve();
          existing.addEventListener('load', () => resolve());
          return;
        }
        const s = document.createElement('script');
        s.id = 'chartjs-cdn';
        s.src = 'https://cdn.jsdelivr.net/npm/chart.js';
        s.onload = () => resolve();
        document.body.appendChild(s);
      });
    },
    setPrepSort(mode) {
      this.prepSort = mode;
      const data = this.getSortedPrepTimes();
      if (this.prepChart) this.updatePrepChart(data);
      else this.renderPrepTimesChart();
    },
    getSortedPrepTimes() {
      const arr = [...this.prepTimes];
      // Agréger par camion si truck_name existe, moyenne des temps
      const byTruck = {};
      for (const r of arr) {
        const key = r.truck_name || `#${r.id}`;
        if (!byTruck[key]) byTruck[key] = { label: key, total: 0, count: 0 };
        byTruck[key].total += Number(r.prep_seconds) || 0;
        byTruck[key].count += 1;
      }
      let out = Object.values(byTruck).map(x => ({ label: x.label, prep_seconds: Math.round(x.total / Math.max(1, x.count)) }));
      if (this.prepSort === 'asc') out.sort((a,b) => a.prep_seconds - b.prep_seconds);
      else if (this.prepSort === 'desc') out.sort((a,b) => b.prep_seconds - a.prep_seconds);
      // none: garder l'ordre initial des labels agrégés (tri alphabétique par label pour stabilité)
      return out;
    },
    async renderPrepTimesChart() {
      await this.ensureChartJs();
      const canvas = document.getElementById('prepTimesChart');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const data = this.getSortedPrepTimes();
      if (!this.prepChart) {
        const labels = data.map(d => d.label);
        const values = data.map(d => Number(d.prep_seconds)||0);
        this.prepChart = markRaw(new window.Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [{
              label: 'Temps (h/m/s)',
              data: values,
              backgroundColor: 'rgba(231, 76, 60, 1)',
              borderColor: 'rgba(231, 76, 60, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, ticks: { precision: 0, callback: (val) => this.formatHms(val) } }
            },
            plugins: {
              legend: { display: false },
              tooltip: { enabled: true, callbacks: { label: (ctx) => `Temps: ${this.formatHms(ctx.parsed?.y ?? ctx.raw)}` } }
            }
          }
        }));
      } else {
        this.updatePrepChart(data);
      }
    },
    updatePrepChart(data) {
      try {
        const labels = data.map(d => d.label);
        const values = data.map(d => Number(d.prep_seconds)||0);
        this.prepChart.data.labels = labels;
        if (this.prepChart.data.datasets && this.prepChart.data.datasets[0]) {
          this.prepChart.data.datasets[0].data = values;
        }
        this.prepChart.update();
      } catch (e) {
        console.error('Erreur update chart, recréation:', e);
        try { this.prepChart.destroy(); } catch(_) { /* ignore destroy error */ }
        this.prepChart = null;
        this.$nextTick(() => this.renderPrepTimesChart());
      }
    },
    getOrdersByTruckData() {
      const raw = this.stats && this.stats.orders_by_truck;
      if (!raw) return null;
      // Cas objet: { Truck A: 10, Truck B: 5 }
      if (!Array.isArray(raw) && typeof raw === 'object') {
        const labels = Object.keys(raw);
        const values = Object.values(raw).map(v => Number(v) || 0);
        return { labels, values };
      }
      // Cas tableau: [{ name: 'Truck A', count: 10 }, ...]
      if (Array.isArray(raw)) {
        const tryKeys = (item) => item.name || item.truck || item.label || item.id || 'N/A';
        const tryVal = (item) => (
          item.count ?? item.orders ?? item.total ?? item.value ?? 0
        );
        const labels = raw.map(tryKeys);
        const values = raw.map(it => Number(tryVal(it)) || 0);
        return { labels, values };
      }
      return null;
    },
    async renderOrdersByTruckChart() {
      await this.ensureChartJs();
      const data = this.getOrdersByTruckData();
      const canvas = document.getElementById('ordersByTruckChart');
      if (!canvas || !data) return;
      const ctx = canvas.getContext('2d');
      if (this.ordersChart) {
        this.ordersChart.destroy();
        this.ordersChart = null;
      }
      this.ordersChart = markRaw(new window.Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [{
            label: 'Nombre de commandes',
            data: data.values,
            backgroundColor: 'rgba(54, 162, 235, 1)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: { beginAtZero: true, ticks: { precision: 0 } }
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true }
          }
        }
      }));
    }
  },
  async mounted() {
    try {
      const res = await axios.get('https://api.axia.quest/api/stats');
      this.stats = res.data;
      try {
        const prep = await axios.get('https://api.axia.quest/api/stats/prep-times', { withCredentials: true });
        this.prepTimes = Array.isArray(prep.data) ? prep.data : [];
      } catch (e) {
        console.warn('prep-times indisponible:', e?.response?.data || e?.message);
        this.prepTimes = [];
      }
      await this.$nextTick();
      await this.renderOrdersByTruckChart();
      await this.renderPrepTimesChart();
    } catch (error) {
      console.error('Erreur lors de la récupération des stats :', error);
    }
  }
}
</script>

<style scoped>
.dashboard {
  width: 100%;
  padding: 1.5rem;
  box-sizing: border-box;
  max-width: 100%;
  overflow-x: hidden;
}

.dashboard h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2rem;
  font-weight: 600;
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.stat {
  background: #fff;
  padding: 1.5rem;
  text-align: center;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.stat h3 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.stat p {
  margin: 0;
  color: #6c757d;
  font-size: 1rem;
  font-weight: 500;
}

.chart-section {
  margin-top: 2rem;
}

.chart-section h2 {
  text-align: left;
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.chart-container {
  background: #fff;
  padding: 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border: 1px solid #e9ecef;
  height: 360px;
  max-width: 100%;
  overflow: hidden;
}

.chart-section button {
  padding: 6px 10px;
  border-radius: 8px;
  background: #fff;
  border: 1px solid #e9ecef;
  cursor: pointer;
}
.chart-section button.active {
  background: #2c3e50;
  color: #fff;
}
</style>
