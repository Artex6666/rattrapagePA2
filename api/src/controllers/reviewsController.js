const svc = require('../services/reviewsService');

async function getPublic(req, res){
  const rows = await svc.listPublicReviews();
  res.json(rows);
}
async function submit(req, res){
  const { rating, comment } = req.body;
  if (!rating || !comment) return res.status(400).json({ error: 'Note et commentaire requis' });
  const id = await svc.createReview(req.user.id, rating, comment);
  res.status(201).json({ id });
}
async function getMine(req, res){ res.json(await svc.listMyReviews(req.user.id)); }
async function adminList(req, res){ res.json(await svc.adminListReviews()); }
async function approve(req, res){ await svc.approveReview(req.params.id); res.json({ ok:true }); }
async function reject(req, res){ await svc.rejectReview(req.params.id); res.json({ ok:true }); }
async function remove(req, res){ await svc.deleteReview(req.params.id); res.json({ ok:true }); }

module.exports = { getPublic, submit, getMine, adminList, approve, reject, remove };


