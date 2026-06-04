module.exports = {
  apps: [{
    name: 'mones-cms',
    script: 'server.js',
    cwd: '/opt/mones-cms',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '256M',
    env: { NODE_ENV: 'production', PORT: 3010 }
  }]
};
