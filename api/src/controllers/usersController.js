const svc = require('../services/usersService');

async function me(req, res){
  const user = await svc.getMe(req.user.id);
  res.json({ user });
}
async function update(req, res){
  if (req.body.newsletter_optin == null) return res.status(400).json({ error: 'newsletter_optin requis' });
  const user = await svc.updateMe(req.user.id, { newsletter_optin: req.body.newsletter_optin });
  res.json({ user });
}

module.exports = { me, update };


