module.exports = {
  apps: [{
    name: 'server',
    script: './server.js',
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '8G', // Redémarre si > 8GB (vous avez 94GB de RAM)
    node_args: '--max-old-space-size=8192', // Limite à 8GB
    env: {
      NODE_ENV: 'production',
      NODE_OPTIONS: '--max-old-space-size=8192'
    },
    error_file: '~/.pm2/logs/server-error.log',
    out_file: '~/.pm2/logs/server-out.log',
    log_file: '~/.pm2/logs/server-combined.log',
    time: true,
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s',
    // Optimisations supplémentaires
    kill_timeout: 5000,
    listen_timeout: 3000,
    shutdown_with_message: false
  }]
}
