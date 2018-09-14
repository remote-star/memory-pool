import * as Koa from 'koa'
import * as Router from 'koa-router'

const app = new Koa()
const router = new Router()


router.get('/', () => {
    console.info(111)
  })
// 中间层，用来连接数据库
// const Monk = require('monk')
// const mongodb = Monk('localhost/test') // test就是你的数据库
// // 读取user集合
// const user = mongodb.get('user')
// // 必须异步操作，不然读不出来数据
// const main = async ctx => {
//     const data1 = await user.find()
//     ctx.response.body = data1
// }
app
  .use(router.routes())
  .use(router.allowedMethods())
app.listen(3000)
