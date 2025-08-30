const { run, all, get } = require('../utils/db');
const { sendMail } = require('../utils/mailer');

async function listPublicReviews(limit = 20) {
  return await all(
    'SELECT r.id, r.rating, r.comment, r.created_at, u.first_name, u.last_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.status = "approved" ORDER BY r.created_at DESC LIMIT ?',[limit]
  );
}

async function createReview(userId, rating, comment) {
  const r = await run('INSERT INTO reviews (user_id, rating, comment, status) VALUES (?, ?, ?, ?)', [userId, Math.max(1, Math.min(5, rating)), comment, 'pending']);
  return r.lastID;
}

async function listMyReviews(userId) {
  return await all('SELECT * FROM reviews WHERE user_id = ? ORDER BY created_at DESC', [userId]);
}

async function adminListReviews() {
  return await all('SELECT r.*, u.email, u.first_name, u.last_name FROM reviews r JOIN users u ON u.id = r.user_id ORDER BY r.created_at DESC');
}

async function setStatusAndNotify(id, status) {
  // Update status
  await run('UPDATE reviews SET status = ? WHERE id = ?', [status, id]);
  try {
    const row = await get('SELECT r.id, r.rating, r.comment, u.email, u.first_name FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.id = ?', [id]);
    if (row && row.email) {
      const isApproved = status === 'approved';
      const subject = isApproved ? "Votre avis a été publié" : "Votre avis a été refusé";
      const reason = isApproved ?
        `<p>Merci pour votre retour ! Votre avis (note ${row.rating}/5) est maintenant visible publiquement.</p>` :
        `<p>Votre avis n'a pas été publié. Il ne respecte pas notre charte de modération.</p>`;
      await sendMail({
        to: row.email,
        subject,
        html: `<p>Bonjour ${row.first_name || ''},</p>${reason}<p>Contenu de votre avis :</p><blockquote>${String(row.comment || '').replace(/</g,'&lt;')}</blockquote>`
      });
    }
  } catch (e) {
    // ignorer l'erreur d'envoi de mail pour ne pas bloquer l'API
  }
}

async function approveReview(id) { await setStatusAndNotify(id, 'approved'); }
async function rejectReview(id) { await setStatusAndNotify(id, 'rejected'); }
async function deleteReview(id) { await run('DELETE FROM reviews WHERE id = ?', [id]); }

module.exports = { listPublicReviews, createReview, listMyReviews, adminListReviews, approveReview, rejectReview, deleteReview };


