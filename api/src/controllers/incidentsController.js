const svc = require('../services/incidentsService');

async function create(req, res){
  const { truck_id, type, title, description, priority } = req.body;
  if (!truck_id || !type || !title) return res.status(400).json({ error: 'Champs requis manquants' });
  const t = await svc.getTruck(truck_id);
  if (!t) return res.status(404).json({ error: 'Camion introuvable' });
  if (!(req.user.role === 'ADMIN' || (t.franchisee_user_id && t.franchisee_user_id === req.user.id))) return res.status(403).json({ error: 'Forbidden' });
  const id = await svc.createIncident({ truck_id, reporter_user_id: req.user.id, type, title, description, priority });
  res.status(201).json({ id });
}

async function list(req, res){
  const raw = (req.user.role === 'ADMIN') ? (await svc.listAllIncidents()) : (await svc.listIncidentsForFranchise(req.user.id));
  const out = raw.map(r => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    status: r.status,
    priority: r.priority || 'moyenne',
    created_at: r.created_at,
    updated_at: r.updated_at,
    resolved_at: r.resolved_at,
    truck: { id: r.truck_id, name: r.truck_name },
    franchisee: r.franchisee_email ? {
      email: r.franchisee_email,
      first_name: r.franchisee_first_name || null,
      last_name: r.franchisee_last_name || null
    } : null
  }));
  return res.json(out);
}

async function update(req, res){
  const updated = await svc.updateIncident(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Incident introuvable' });
  res.json({ ok:true });
}

async function remove(req, res){ await svc.deleteIncident(req.params.id); res.json({ ok:true }); }

module.exports = { create, list, update, remove };


