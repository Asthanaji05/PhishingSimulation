require('dotenv').config();

const config = {
  supabase: {
    url: process.env.REACT_APP_SUPABASE_URL,
    anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.REACT_APP_SUPABASE_SERVICE_ROLE_KEY
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  },
  server: {
    port: parseInt(process.env.SERVER_PORT) || 3000,
    trackingBaseUrl: process.env.TRACKING_BASE_URL || 'http://localhost:3000'
  }
};

module.exports = config;
