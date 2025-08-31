const { all, get, run } = require('../utils/db');

async function getTruck(id) { return await get('SELECT * FROM trucks WHERE id = ?', [id]); }

async function createIncident({ truck_id, reporter_user_id, type, title, description, priority }) {
  const p = priority || 'moyenne';
  const r = await run('INSERT INTO truck_incidents (truck_id, reporter_user_id, type, title, description, priority) VALUES (?, ?, ?, ?, ?, ?)', [truck_id, reporter_user_id, type, title, description || null, p]);
  return r.lastID;
}

async function listAllIncidents() {
  return await all(
    `SELECT i.*, 
            t.id AS truck_id, t.name AS truck_name,
            u.id AS franchisee_user_id, u.email AS franchisee_email, u.first_name AS franchisee_first_name, u.last_name AS franchisee_last_name
     FROM truck_incidents i
     JOIN trucks t ON t.id = i.truck_id
     LEFT JOIN users u ON u.id = t.franchisee_user_id
     ORDER BY i.created_at DESC`
  );
}

async function listIncidentsForFranchise(userId) {
  return await all(
    `SELECT i.*, 
            t.id AS truck_id, t.name AS truck_name,
            u.id AS franchisee_user_id, u.email AS franchisee_email, u.first_name AS franchisee_first_name, u.last_name AS franchisee_last_name
     FROM truck_incidents i
     JOIN trucks t ON t.id = i.truck_id
     LEFT JOIN users u ON u.id = t.franchisee_user_id
     WHERE t.franchisee_user_id = ?
     ORDER BY i.created_at DESC`,
    [userId]
  );
}

async function updateIncident(id, { status, title, description, priority, resolved }) {
  const inc = await get('SELECT * FROM truck_incidents WHERE id = ?', [id]);
  if (!inc) return null;
  const newStatus = status || inc.status;
  const newPriority = priority || inc.priority || 'moyenne';
  await run('UPDATE truck_incidents SET status = ?, title = ?, description = ?, priority = ?, updated_at = CURRENT_TIMESTAMP, resolved_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE resolved_at END WHERE id = ?', [newStatus, title || inc.title, description || inc.description, newPriority, resolved ? 1 : 0, id]);
  // Si panne critique => désactiver le camion
  if (inc.type === 'panne' && (newPriority === 'critique')) {
    await run('UPDATE trucks SET active = 0 WHERE id = ?', [inc.truck_id]);
  }
  return await get('SELECT * FROM truck_incidents WHERE id = ?', [id]);
}

async function deleteIncident(id) { await run('DELETE FROM truck_incidents WHERE id = ?', [id]); }

module.exports = { getTruck, createIncident, listAllIncidents, listIncidentsForFranchise, updateIncident, deleteIncident };


