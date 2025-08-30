const svc = require('../services/newsletterService');

async function list(req, res){ res.json(await svc.listCampaigns()); }
async function create(req, res){
  const { subject, body_html, scheduled_at } = req.body;
  if (!subject || !body_html) return res.status(400).json({ error: 'Sujet et contenu requis' });
  const id = await svc.createCampaign({ subject, body_html, scheduled_at });
  res.status(201).json({ id });
}
async function sendNow(req, res){
  const c = await svc.getCampaign(req.params.id);
  if (!c) return res.status(404).json({ error: 'Campagne introuvable' });
  await svc.sendCampaignToAll(c);
  res.json({ ok: true });
}
async function schedule(req, res){
  const { scheduled_at } = req.body;
  if (!scheduled_at) return res.status(400).json({ error: 'scheduled_at requis' });
  await svc.scheduleCampaign(req.params.id, scheduled_at);
  res.json({ ok: true });
}

// simple scheduler loop
setInterval(async ()=>{
  try{
    const nowIso = new Date().toISOString();
    const due = await svc.dueScheduled(nowIso);
    for (const c of due) await svc.sendCampaignToAll(c);
  } catch(e){ /* ignore */ }
}, 60*1000);

module.exports = { list, create, sendNow, schedule };


