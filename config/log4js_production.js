const log4js = require('log4js')
log4js.configure({
    appenders: [{
            type: 'console',
            category: 'console'
        }, // 系统日志 
        {
            type: 'dateFile',
            filename: '/mnt/logs/nodejs/channel_product/stdout/stdout.log',
            pattern: '_yyyy-MM-dd',
            alwaysIncludePattern: true,
            layout: {
                type: 'basic'
            },
            category: 'stdout'
        }, // 连接日志 
        {
            type: 'dateFile',
            filename: '/mnt/logs/nodejs/channel_product/connect/connect.log',
            pattern: '_yyyy-MM-dd',
            alwaysIncludePattern: true,
            layout: {
                type: 'basic'
            },
            category: 'connect'
        }, // 服务者订阅订单日志  
        {
            type: 'dateFile',
            filename: '/mnt/logs/nodejs/channel_product/subscribe_order/subscribe_order.log',
            pattern: '_yyyy-MM-dd',
            alwaysIncludePattern: true,
            layout: {
                type: 'pattern',
                pattern: '[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%5.5p] - %m'
            },
            category: 'subscribeOrder'
        }, // 用户订单服务者抢单日志 
        {
            type: 'dateFile',
            filename: '/mnt/logs/nodejs/channel_product/subscribe_accepted/subscribe_accepted.log',
            pattern: '_yyyy-MM-dd',
            alwaysIncludePattern: true,
            layout: {
                type: 'pattern',
                pattern: '[%d{yyyy-MM-dd hh:mm:ss.SSS}] [%5.5p] - %m'
            },
            category: 'subscribeAccepted'
        }
    ],
    replaceConsole: true, //替换console.log
    levels: {
        console: 'DEBUG',
        stdout: 'DEBUG',
        connect: 'DEBUG',
        subscribeOrder: 'DEBUG',
        subscribeAccepted: 'DEBUG'
    }
})

const connectLog = log4js.getLogger('connect')

exports.loggerFactory = log4js

exports.use = function (app) {
    //页面请求日志,用auto的话,默认级别是WARN  
    /*
    app.use(log4js.connectLogger(subscribeAcceptedLog, {
        level: 'auto',
        format: ':method :url'
    }));
    */
    app.use(log4js.connectLogger(connectLog, {
        level: 'auto',
        format: ':remote-addr :method :url :user-agent :status :response-time ms'
    }))
}
