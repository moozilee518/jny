const env = process.env
const redis = require('redis')
const fs = require('fs')
const config = require(`../config/system_config_${env.NODE_ENV}`)
const log4js = require(`${config.log4js}`)
const uuid = require('node-uuid')
const express = require('express')
const app = express();

// 加载日志模板
log4js.use(app);

const loggerFactory = log4js.loggerFactory
const logger = loggerFactory.getLogger('stdout')
const subOrderLogger = loggerFactory.getLogger('subscribeOrder')
const subAcceptedLogger = loggerFactory.getLogger('subscribeAccepted')

// 发布需求订单
app.get('/publish_order', (req, res) => {
    const query = req.query
    if (typeof query.userId == 'undefined') {
        res.end('Invalid Request\n');
    } else {
        pubData = JSON.parse(fs.readFileSync(config.demandInfoFile))
        let channel = rebuildRedisKey(`order_${query.userId}`)
        redisPub(res, channel, JSON.stringify(pubData));
    }
})

// 订阅订单
app.get('/subscribe_order', (req, res) => {
    let query = req.query
    query.reqId = uuid.v1()
    let queryString = JSON.stringify(query)
    query.logger = subOrderLogger
    query.logger.info(`[request] ${queryString}`)
    if (typeof query.accessToken == 'undefined') {
        res.end('Invalid Request\n')
        query.logger.warn(`[response] Invalid Request {reqId:${query.reqId}}`)
    } else {
        authUser(query, res, (userId) => {

            let client = getRedisClient()
            let channel = rebuildRedisKey(`order_${userId}`)
            client.on('ready', (result) => {
                client.subscribe(channel, (err, reply) => {
                    if (err) {
                        query.logger.debug(`[subscribe_fail] {reqId:${query.reqId},userId:${userId},errorMessage:${err}}`)
                    } else {
                        query.logger.debug(`[subscribe_success] {reqId:${query.reqId},userId:${userId},channel:${reply}}`)
                    }
                })
            })
            client.on('message', (channel, message) => {
                let response = {
                    'reqId': query.reqId,
                    'retCode': '0',
                    'data': message
                }

                let responseString = JSON.stringify(response)
                let preOrderId = JSON.parse(message).preOrderId
                client.unsubscribe(channel)
                client.end(true)
                saddServants(preOrderId, userId, query)
                res.end(responseString)
                query.logger.info(`[response] {userId:${userId},return:${responseString}}`)
            })
            res.on('close', () => {
                client.unsubscribe(channel)
                client.end(true)
                query.logger.debug(`[close] unsubscribe {reqId:${query.reqId},channel:${channel}}`)
            })

        })
    }
})

// 发布接单用户信息
app.get('/publish_accepted', (req, res) => {
    const query = req.query
    if (typeof query.preOrderId == 'undefined') {
        res.end('Invalid Request\n');
    } else {
        pubData = JSON.parse(fs.readFileSync(config.acceptedUserFile))
        let channel = rebuildRedisKey(`pre_order_accepted_${query.preOrderId}`)
        redisPub(res, channel, JSON.stringify(pubData));
    }
})

// 订阅响应接单
app.get('/subscribe_accepted', (req, res) => {
    let query = req.query
    query.reqId = uuid.v1()
    let queryString = JSON.stringify(query)
    query.logger = subAcceptedLogger
    query.logger.info(`[request] ${queryString}`)
    if (typeof query.accessToken == 'undefined' || typeof query.preOrderId == 'undefined') {
        res.end('Invalid Request\n')
        query.logger.warn(`[response] Invalid Request {reqId:${query.reqId}}`)
    } else {
        authUser(query, res, (userId) => {

            let client = getRedisClient()
            let channel = rebuildRedisKey(`pre_order_accepted_${query.preOrderId}`)
            client.on('ready', (result) => {
                client.subscribe(channel, (err, reply) => {
                    if (err) {
                        query.logger.error(`[subscribe_fail] {reqId:${query.reqId},userId:${userId},errorMessage:${err}}`)
                    } else {
                        query.logger.debug(`[subscribe_success] {reqId:${query.reqId},userId:${userId},channel:${reply}}`)
                    }
                })
            })
            client.on('message', (channel, message) => {
                let response = {
                    'reqId': query.reqId,
                    'retCode': '0',
                    'data': message
                }
                client.unsubscribe()
                client.end(true)
                let responseString = JSON.stringify(response)
                res.end(responseString)
                query.logger.info(`[response] {userId:${userId},return:${responseString}}`)
            })
            res.on('close', () => {
                client.unsubscribe(channel)
                client.end(true)
                query.logger.debug(`[close] unsubscribe {reqId:${query.reqId},channel:${channel}}`)
            })

        })
    }
})

// 连接redis
function getRedisClient() {
    let client = redis.createClient(config.redis.port, config.redis.host)
    client.auth(config.redis.password);
    return client;
}

// 用户登录鉴权
function authUser(query, res, callback) {
    let client = getRedisClient()
    let loginKey = rebuildRedisKey(`login_${query.accessToken}`)
    client.get(loginKey, function (error, userId) {

        if (error) {
            logger.error(error);
        } else {
            // accessToken无效 未登录
            if (!userId) {
                let resData = {
                    'reqId': query.reqId,
                    'retCode': '10002',
                    'errorMsg': '您还未登录'
                }
                let responseString = JSON.stringify(resData)
                res.end(responseString)
                query.logger.info(responseString)
                return
            }
            callback(userId)
        }
        client.end(true)
    })
}

// 通过redis发布
function redisPub(res, channel, pubData) {
    let client = getRedisClient()
    client.publish(channel, pubData, (error, result) => {
        let resData = {
            'retCode': '0',
            'channel': channel
        }
        res.end(JSON.stringify(resData))
        client.end(true)
    })
}

// 添加至已订阅成功接收preOrderId的服务者集合中
function saddServants(preOrderId, userId, query) {
    let client = getRedisClient()
    let notifiedServantsKey = rebuildRedisKey(`notified_servant_${preOrderId}`)
    client.sadd(notifiedServantsKey, userId, function (error, result) {
        if (error) {
            query.logger.error(`{reqId:${query.reqId}}`)
            query.logger.error(error)
        }
        client.end(true)
    })
}

// 重写redis key添加项目前辍
function rebuildRedisKey(key) {
    return `${config.redis.projectPrefix}_${key}`;
}

// 监听端口
app.listen(config.port, config.ip, () => {
    console.log(`Server is listening on http://${config.serverName}:${config.port}`)
});
