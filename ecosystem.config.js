module.exports = {
  apps: [{
    name: 'cleaning-pos',
    script: '.next/standalone/server.js',
    cwd: '/var/www/cleaning-pos',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
      DATABASE_URL: 'file:/var/www/cleaning-pos/prisma/dev.db',
      UPLOAD_DIR: '/var/www/cleaning-pos/uploads_data',
    },
    restart_delay: 3000,
    max_restarts: 10,
  }]
}
