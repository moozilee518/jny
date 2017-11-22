module.exports = {
  serverName: 'api.jny0573.com',
  ip: '172.19.49.91',
  port: 9000,
  redis: {
    host: '127.0.0.1',
    port: 6379,
    password: 'paopao@redis',
    projectPrefix: 'jny-product'
  },
  log4js: '../config/log4js_production',
  demandInfoFile: '/mnt/nodejs-deploy/mock/demand_info.json',
  acceptedUserFile: '/mnt/nodejs-deploy/mock/accepted_user.json'
}
