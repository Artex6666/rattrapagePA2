const { get, run } = require('../utils/db');

async function getMe(id) {
  return await get('SELECT id, email, first_name, last_name, role, balance_cents, loyalty_points, newsletter_optin FROM users WHERE id = ?', [id]);
}

async function updateMe(id, { newsletter_optin }) {
  await run('UPDATE users SET newsletter_optin = ? WHERE id = ?', [newsletter_optin ? 1 : 0, id]);
  return await getMe(id);
}

module.exports = { getMe, updateMe };


