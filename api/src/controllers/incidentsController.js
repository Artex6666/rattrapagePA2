const svc = require('../services/incidentsService');

async function create(req, res){
  const { truck_id, type, title, description } = req.body;
  if (!truck_id || !type || !title) return res.status(400).json({ error: 'Champs requis manquants' });
  const t = await svc.getTruck(truck_id);
  if (!t) return res.status(404).json({ error: 'Camion introuvable' });
  if (!(req.user.role === 'ADMIN' || (t.franchisee_user_id && t.franchisee_user_id === req.user.id))) return res.status(403).json({ error: 'Forbidden' });
  const id = await svc.createIncident({ truck_id, reporter_user_id: req.user.id, type, title, description });
  res.status(201).json({ id });
}

async function list(req, res){
  if (req.user.role === 'ADMIN') return res.json(await svc.listAllIncidents());
  return res.json(await svc.listIncidentsForFranchise(req.user.id));
}

async function update(req, res){
  const updated = await svc.updateIncident(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Incident introuvable' });
  res.json({ ok:true });
}

async function remove(req, res){ await svc.deleteIncident(req.params.id); res.json({ ok:true }); }

module.exports = { create, list, update, remove };


