const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

module.exports = {
  apiPort: process.env.API_PORT || 3000,
  frontPort: process.env.FRONT_PORT || 4000,
  backPort: process.env.BACK_PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || path.resolve(process.cwd(), 'db.sqlite'),
  jwtSecret: process.env.JWT_SECRET || 'dev_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  adminEmail: process.env.ADMIN_EMAIL || 'admin@example.com',
  adminPassword: process.env.ADMIN_PASSWORD || 'admin123',
  uploadDir: path.resolve(process.cwd(), 'uploads'),
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT,
  smtpSecure: process.env.SMTP_SECURE,
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  smtpFrom: process.env.SMTP_FROM,
  baseDomain: process.env.BASE_DOMAIN || 'axia.quest',
  frontUrl: process.env.FRONT_URL || 'https://axia.quest',
  backUrl: process.env.BACK_URL || 'https://admin.axia.quest',
  apiUrl: process.env.API_URL || 'https://api.axia.quest',
  nodeEnv: process.env.NODE_ENV || 'development',
  get isProd() { return this.nodeEnv === 'production'; },
};


