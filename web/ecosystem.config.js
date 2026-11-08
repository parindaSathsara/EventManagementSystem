/**
 * PM2 process descriptor for the Stage website (Next.js).
 *
 *   pm2 start ecosystem.config.js --env production   # first time (deploy.sh does this)
 *   pm2 reload events-web                            # pick up a new build
 *   pm2 logs events-web
 *
 * Named `events-web` (next to the API's `events-ai`). The workspace container
 * already runs an unrelated `staging-web` — never reuse that name.
 *
 * The port comes from web/.env.production (PORT=…), default 8012 — 8000 and
 * 8011 are taken by other apps / the Stage API in the same container.
 */
const fs = require('fs');
const path = require('path');

function readEnvFile(file) {
  try {
    return Object.fromEntries(
      fs.readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/))
        .filter(Boolean)
        .map(([, key, value]) => [key, value.replace(/^['"]|['"]$/g, '')]),
    );
  } catch {
    return {};
  }
}

const env = readEnvFile(path.join(__dirname, '.env.production'));
const PORT = env.PORT || process.env.PORT || '8012';

module.exports = {
  apps: [
    {
      name: 'events-web',
      cwd: __dirname,
      script: 'node_modules/next/dist/bin/next',
      // Bound to all interfaces: nginx runs in a separate container and
      // reaches us as aahaas-workspace-1:<PORT>.
      args: `start -p ${PORT}`,
      exec_mode: 'fork',
      instances: 1,
      max_memory_restart: '600M',
      listen_timeout: 10000,
      kill_timeout: 5000,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 2000,
      env_production: {
        NODE_ENV: 'production',
        PORT,
      },
      error_file: '/var/log/events-web/error.log',
      out_file: '/var/log/events-web/out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
