const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const mime = require('mime-types');
const { run, all, get } = require('../utils/db');
const { sendMail } = require('../utils/mailer');
const { ensureAuth, ensureRole } = require('../utils/auth');
const config = require('../utils/config');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(config.uploadDir, 'franchises', String(req.user.id));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `preuve_virement_${Date.now()}.pdf`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const mimeType = file.mimetype;
    const ext = path.extname(file.originalname).toLowerCase();
    if (mimeType !== 'application/pdf' || ext !== '.pdf') return cb(new Error('PDF uniquement'));
    cb(null, true);
  }
});

router.post('/apply', ensureAuth, upload.single('preuvePdf'), async (req, res) => {
  try {
    const { siret, tva, phone } = req.body;
    if (!siret || !tva || !req.file) return res.status(400).json({ error: 'Champs requis manquants' });
    await run('INSERT INTO franchise_applications (user_id, siret, tva, phone, pdf_path, status) VALUES (?, ?, ?, ?, ?, ?)', [req.user.id, siret, tva, phone || null, req.file.path, 'en_attente']);
    return res.status(201).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

router.get('/applications', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const rows = await all(`SELECT fa.*, u.email, u.first_name, u.last_name FROM franchise_applications fa JOIN users u ON u.id = fa.user_id ORDER BY fa.created_at DESC`);
  // Adapter au format attendu par le back-office
  const mapped = rows.map(r => {
    const rel = r.pdf_path ? r.pdf_path.replace(/^.*uploads/, '/uploads') : null;
    const pdfUrl = rel ? `${config.apiUrl}${rel}` : null;
    return {
      id: r.id,
      applicant_name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
      email: r.email,
      siret: r.siret,
      tva_number: r.tva,
      phone: r.phone || null,
      status: r.status,
      created_at: r.created_at,
      documents: pdfUrl ? [{ id: r.id, name: 'Preuve de virement', url: pdfUrl }] : []
    };
  });
  return res.json(mapped);
});

router.post('/applications/:id/approve', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const appId = req.params.id;
  const app = await get('SELECT * FROM franchise_applications WHERE id = ?', [appId]);
  if (!app) return res.status(404).json({ error: 'Dossier introuvable' });
  await run('UPDATE franchise_applications SET status = ? WHERE id = ?', ['approuvé', appId]);
  // Promote user to franchisé (but protect OP admin from demotion)
  const user = await get('SELECT * FROM users WHERE id = ?', [app.user_id]);
  if (user && user.role !== 'ADMIN') {
    await run('UPDATE users SET role = ?, is_validated = 1 WHERE id = ?', ['franchisé', app.user_id]);
  }
  return res.json({ ok: true });
});

router.post('/applications/:id/reject', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  const appId = req.params.id;
  const app = await get('SELECT * FROM franchise_applications WHERE id = ?', [appId]);
  if (!app) return res.status(404).json({ error: 'Dossier introuvable' });
  
  // Marquer la candidature comme rejetée
  await run('UPDATE franchise_applications SET status = ? WHERE id = ?', ['rejeté', appId]);
  
  // Repasser l'utilisateur en client (membre simple)
  await run('UPDATE users SET role = ?, is_validated = 0 WHERE id = ?', ['client', app.user_id]);
  
  // Envoi du mail de refus si message fourni
  try {
    const u = await get('SELECT email, first_name FROM users WHERE id = ?', [app.user_id]);
    const { message } = req.body || {};
    if (u && u.email && message) {
      await sendMail({ to: u.email, subject: "Votre candidature franchisé a été rejetée", html: `<p>Bonjour ${u.first_name || ''},</p><p>Votre candidature a été rejetée.</p><p>Raison: ${String(message).replace(/</g,'&lt;')}</p><p>Cordialement,</p>` });
    }
  } catch(e) { /* ignore mail errors */ }
  
  return res.json({ ok: true });
});

// Récupérer la candidature de l'utilisateur courant (suivi)
router.get('/my-application', ensureAuth, async (req, res) => {
  const row = await get('SELECT * FROM franchise_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1', [req.user.id]);
  if (!row) return res.json(null);
  const rel = row.pdf_path ? row.pdf_path.replace(/^.*uploads/, '/uploads') : null;
  return res.json({
    id: row.id,
    siret: row.siret,
    tva: row.tva,
    phone: row.phone,
    status: row.status,
    created_at: row.created_at,
    pdf_url: rel ? `${config.apiUrl}${rel}` : null
  });
});

// Récupérer la liste des candidatures en attente (is_validated = 0 OU status = en_attente)
router.get('/pending', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  try {
    const rows = await all(`
      SELECT 
        fa.id,
        fa.user_id,
        fa.siret,
        fa.tva as tva_number,
        fa.phone,
        fa.created_at,
        u.email,
        u.first_name,
        u.last_name,
        fa.pdf_path
      FROM franchise_applications fa 
      JOIN users u ON u.id = fa.user_id 
      WHERE (fa.status = 'en_attente' OR u.is_validated = 0) AND u.role != 'ADMIN'
      ORDER BY fa.created_at DESC
    `);
    
    const mapped = rows.map(r => {
      const rel = r.pdf_path ? r.pdf_path.replace(/^.*uploads/, '/uploads') : null;
      const pdfUrl = rel ? `${config.apiUrl}${rel}` : null;
      return {
        id: r.id,
        user_id: r.user_id,
        applicant_name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        email: r.email,
        siret: r.siret,
        tva_number: r.tva_number,
        phone: r.phone || null,
        created_at: r.created_at,
        documents: pdfUrl ? [{ id: r.id, name: 'Preuve de virement', url: pdfUrl }] : []
      };
    });
    
    return res.json(mapped);
  } catch (error) {
    console.error('Erreur lors du chargement des candidatures en attente:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer la liste des franchisés validés (is_validated = 1)
router.get('/validated', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  try {
    const rows = await all(`
      SELECT 
        fa.id,
        fa.user_id,
        fa.siret,
        fa.tva as tva_number,
        fa.phone,
        fa.created_at,
        u.email,
        u.first_name,
        u.last_name,
        fa.pdf_path
      FROM franchise_applications fa 
      JOIN users u ON u.id = fa.user_id 
      WHERE fa.status = 'approuvé' AND u.is_validated = 1 AND u.role = 'franchisé'
      ORDER BY fa.created_at DESC
    `);
    
    const mapped = rows.map(r => {
      const rel = r.pdf_path ? r.pdf_path.replace(/^.*uploads/, '/uploads') : null;
      const pdfUrl = rel ? `${config.apiUrl}${rel}` : null;
      return {
        id: r.id,
        user_id: r.user_id,
        applicant_name: `${r.first_name || ''} ${r.last_name || ''}`.trim(),
        email: r.email,
        siret: r.siret,
        tva_number: r.tva_number,
        phone: r.phone || null,
        updated_at: r.created_at, // Utiliser created_at comme fallback
        documents: pdfUrl ? [{ id: r.id, name: 'Preuve de virement', url: pdfUrl }] : []
      };
    });
    
    return res.json(mapped);
  } catch (error) {
    console.error('Erreur lors du chargement des franchisés validés:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Convertir un franchisé en membre (libère ses camions)
router.post('/:id/convert-to-member', ensureAuth, ensureRole('ADMIN'), async (req, res) => {
  try {
    const franchiseId = req.params.id;
    
    // Récupérer les informations du franchisé
    const franchise = await get(`
      SELECT fa.user_id, u.email, u.first_name, u.last_name
      FROM franchise_applications fa 
      JOIN users u ON u.id = fa.user_id 
      WHERE fa.id = ? AND fa.status = 'approuvé' AND u.role = 'franchisé'
    `, [franchiseId]);
    
    if (!franchise) {
      return res.status(404).json({ error: 'Franchisé introuvable' });
    }
    
    // Libérer tous les camions attribués à ce franchisé
    await run(`
      UPDATE trucks 
      SET driver_id = NULL, status = 'disponible' 
      WHERE driver_id = ?
    `, [franchise.user_id]);
    
    // Changer le rôle de l'utilisateur de 'franchisé' à 'client'
    await run(`
      UPDATE users 
      SET role = 'client' 
      WHERE id = ?
    `, [franchise.user_id]);
    
    // Marquer la candidature comme convertie
    await run(`
      UPDATE franchise_applications 
      SET status = 'converti' 
      WHERE id = ?
    `, [franchiseId]);
    
    return res.json({ 
      ok: true, 
      message: `Franchisé ${franchise.first_name} ${franchise.last_name} converti en membre avec succès. Ses camions ont été libérés.` 
    });
    
  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
    return res.status(500).json({ error: 'Erreur lors de la conversion' });
  }
});

module.exports = router;


