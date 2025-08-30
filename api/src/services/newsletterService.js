const nodemailer = require('nodemailer');
const { all, get, run } = require('../utils/db');
const config = require('../utils/config');

function createTransporter() {
  return nodemailer.createTransport({
    host: config.smtpHost,
    port: Number(config.smtpPort || 587),
    secure: String(config.smtpSecure) === 'true',
    auth: config.smtpUser ? { user: config.smtpUser, pass: config.smtpPass } : undefined
  });
}

async function listCampaigns() {
  return await all('SELECT * FROM newsletter_campaigns ORDER BY created_at DESC');
}

async function createCampaign({ subject, body_html, scheduled_at }) {
  const status = scheduled_at ? 'scheduled' : 'draft';
  const r = await run('INSERT INTO newsletter_campaigns (subject, body_html, scheduled_at, status) VALUES (?, ?, ?, ?)', [subject, body_html, scheduled_at || null, status]);
  return r.lastID;
}

async function getCampaign(id) { return await get('SELECT * FROM newsletter_campaigns WHERE id = ?', [id]); }

async function markSent(id) { await run('UPDATE newsletter_campaigns SET status = ? WHERE id = ?', ['sent', id]); }

async function scheduleCampaign(id, whenIso) {
  await run('UPDATE newsletter_campaigns SET scheduled_at = ?, status = ? WHERE id = ?', [whenIso, 'scheduled', id]);
}

async function getOptinUsers() { return await all('SELECT id, email FROM users WHERE newsletter_optin = 1'); }

async function logSend(campaignId, userId, status, error_text = null) {
  await run('INSERT INTO newsletter_logs (campaign_id, user_id, status, error_text) VALUES (?, ?, ?, ?)', [campaignId, userId, status, error_text]);
}

async function sendCampaignToAll(campaign) {
  const transporter = createTransporter();
  const users = await getOptinUsers();
  for (const u of users) {
    try {
      await transporter.sendMail({ from: config.smtpFrom || config.smtpUser, to: u.email, subject: campaign.subject, html: campaign.body_html });
      await logSend(campaign.id, u.id, 'sent');
    } catch (e) {
      await logSend(campaign.id, u.id, 'failed', e.message);
    }
  }
  await markSent(campaign.id);
}

async function dueScheduled(nowIso) {
  return await all('SELECT * FROM newsletter_campaigns WHERE status = ? AND scheduled_at IS NOT NULL AND scheduled_at <= ?', ['scheduled', nowIso]);
}

module.exports = { listCampaigns, createCampaign, getCampaign, scheduleCampaign, sendCampaignToAll, dueScheduled };


