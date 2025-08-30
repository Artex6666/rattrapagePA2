const { all, get, run } = require('../utils/db');

async function getTruck(id) { return await get('SELECT * FROM trucks WHERE id = ?', [id]); }

async function createIncident({ truck_id, reporter_user_id, type, title, description }) {
  const r = await run('INSERT INTO truck_incidents (truck_id, reporter_user_id, type, title, description) VALUES (?, ?, ?, ?, ?)', [truck_id, reporter_user_id, type, title, description || null]);
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

async function updateIncident(id, { status, title, description, resolved }) {
  const inc = await get('SELECT * FROM truck_incidents WHERE id = ?', [id]);
  if (!inc) return null;
  await run('UPDATE truck_incidents SET status = ?, title = ?, description = ?, resolved_at = CASE WHEN ? THEN CURRENT_TIMESTAMP ELSE resolved_at END WHERE id = ?', [status || inc.status, title || inc.title, description || inc.description, resolved ? 1 : 0, id]);
  return await get('SELECT * FROM truck_incidents WHERE id = ?', [id]);
}

async function deleteIncident(id) { await run('DELETE FROM truck_incidents WHERE id = ?', [id]); }

module.exports = { getTruck, createIncident, listAllIncidents, listIncidentsForFranchise, updateIncident, deleteIncident };


