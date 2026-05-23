/**
 * PM2 process descriptor for the EventSocial API.
 *
 *   pm2 start ecosystem.config.js --env production
 *   pm2 restart events-ai
 *   pm2 logs events-ai
 *   pm2 save && pm2 startup       # one-time, so it survives reboot
 *
 * Logs go to /var/log/events-ai/ (created by deploy/bootstrap.sh).
 * If that path isn't writable, PM2 falls back to ~/.pm2/logs/ silently.
 */
module.exports = {
  apps: [
    {
      name: 'events-ai',
      script: 'src/index.js',
      cwd: __dirname,
      exec_mode: 'fork',
      instances: 1,
      // Restart the worker if it bloats past 512MB — protects against
      // multer-induced leaks on large video uploads.
      max_memory_restart: '512M',
      // Wait a couple seconds for the HTTP listener to settle before
      // declaring the process online. Helps PM2's "ready" detection.
      listen_timeout: 5000,
      kill_timeout: 5000,
      // Auto-restart on crash, but back off if we crash >10x in 10 minutes
      // (something is structurally wrong; surface it to operators).
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 2000,
      // PM2 sets these env vars only when invoked with --env production.
      env_production: {
        NODE_ENV: 'production',
      },
      // Logging
      error_file: '/var/log/events-ai/error.log',
      out_file: '/var/log/events-ai/out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    },
  ],
};
