// =============================================================================
// ecosystem.config.js
// PM2 Process Manager Configuration — All 6 Services
//
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 save && pm2 startup
//
// Deploy to: /opt/app/ecosystem.config.js
// =============================================================================

module.exports = {
  apps: [
    // ═════════════════════════════════════════════════════════════════════
    // MODULE 1 — Main Application
    // ═════════════════════════════════════════════════════════════════════
    {
      name: 'mod1-frontend',
      cwd: '/opt/app/module1/frontend',
      script: 'npx',
      args: 'serve -s build -l 8081',
      env: {
        NODE_ENV: 'production',
        PORT: 8081
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/opt/app/logs/mod1-frontend-error.log',
      out_file: '/opt/app/logs/mod1-frontend-out.log',
      merge_logs: true
    },
    {
      name: 'mod1-backend',
      cwd: '/opt/app/module1/backend',
      script: 'server.js',               // Adjust to your actual entry file
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '127.0.0.1'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/opt/app/logs/mod1-backend-error.log',
      out_file: '/opt/app/logs/mod1-backend-out.log',
      merge_logs: true
    },

    // ═════════════════════════════════════════════════════════════════════
    // MODULE 2 — Admin Panel
    // ═════════════════════════════════════════════════════════════════════
    {
      name: 'mod2-frontend',
      cwd: '/opt/app/module2/frontend',
      script: 'npx',
      args: 'serve -s build -l 3002',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/opt/app/logs/mod2-frontend-error.log',
      out_file: '/opt/app/logs/mod2-frontend-out.log',
      merge_logs: true
    },
    {
      name: 'mod2-backend',
      cwd: '/opt/app/module2/backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        HOST: '127.0.0.1'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/opt/app/logs/mod2-backend-error.log',
      out_file: '/opt/app/logs/mod2-backend-out.log',
      merge_logs: true
    },

    // ═════════════════════════════════════════════════════════════════════
    // MODULE 3 — Intake Portal
    // ═════════════════════════════════════════════════════════════════════
    {
      name: 'mod3-frontend',
      cwd: '/opt/app/module3/frontend',
      script: 'npx',
      args: 'serve -s build -l 5175',    // Port changed from Vite default 5173
      env: {
        NODE_ENV: 'production',
        PORT: 5175
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/opt/app/logs/mod3-frontend-error.log',
      out_file: '/opt/app/logs/mod3-frontend-out.log',
      merge_logs: true
    },
    {
      name: 'mod3-backend',
      cwd: '/opt/app/module3/backend',
      script: 'server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 8000,
        HOST: '127.0.0.1'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/opt/app/logs/mod3-backend-error.log',
      out_file: '/opt/app/logs/mod3-backend-out.log',
      merge_logs: true
    }
  ]
};
