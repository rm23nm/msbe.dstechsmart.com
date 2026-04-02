module.exports = {
  apps: [
    {
      name: 'masjidkusmart-app',
      script: './backend/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // The DATABASE_URL and JWT_SECRET should be defined in backend/.env
      }
    }
  ]
};
