module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps: [

    // First application
    {
      name: 'jny-channel-development',
      script: '../routes/channel.js',
      watch: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      error_file: '/mnt/logs/nodejs/channel_dev/error.log',
      out_file: '/mnt/logs/nodejs/channel_dev/out.log',
      pid_file: '/mnt/logs/nodejs/channel_dev/pid.log',
      env: {
        NODE_ENV: 'development',
        COMMON_VARIABLE: 'true'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }, {
      name: 'jny-channel-test',
      script: '../routes/channel.js',
      watch: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      error_file: '/mnt/logs/nodejs/channel_test/error.log',
      out_file: '/mnt/logs/nodejs/channel_test/out.log',
      pid_file: '/mnt/logs/nodejs/channel_test/pid.log',
      env: {
        NODE_ENV: 'test',
        COMMON_VARIABLE: 'true'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }, {
      name: 'jny-channel-product',
      script: '../routes/channel.js',
      watch: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
      error_file: '/mnt/logs/nodejs/channel_product/error.log',
      out_file: '/mnt/logs/nodejs/channel_product/out.log',
      pid_file: '/mnt/logs/nodejs/channel_product/pid.log',
      env: {
        NODE_ENV: 'production',
        COMMON_VARIABLE: 'true'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    }
  ],

  /**
   * Deployment section
   * http://pm2.keymetrics.io/docs/usage/deployment/
   */
  deploy: {
    production: {
      user: 'root',
      host: '106.15.48.30',
      port: 9101,
      ref: 'origin/master',
      repo: 'git@github.com:repo.git',
      path: '/var/www/production',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production'
    }
  }
};
