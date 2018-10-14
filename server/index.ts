import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as BodyParser from 'koa-bodyparser'
import * as crypto from 'crypto'
import * as request from 'request'
import * as moment from 'moment'
import WXBizDataCrypt from './WXBizDataCrypt'
import keys from '../key'
import { PostModel, MessageModel } from './models'

const app = new Koa()
const router = new Router()

function authPwd(pwd: string) {
  const md5 = crypto.createHash('md5')
  const salt = 'thisIsReallyALofOfSalt'
  md5.update(pwd + salt)
  const md5Str = md5.digest('hex')

  return '25333dfb17252abfb7bd77f91e0fade7' === md5Str
}

router.put('/api/post', (ctx, next) => {
  if (!ctx.request.body) {
    ctx.status = 400
    return
  }

  const body = ctx.request.body as {
    pwd: string
    title: string
    content: string
  }

  if (!authPwd(body.pwd)) {
    ctx.status = 401
    ctx.body = '别瞎传'
    return
  }

  const instance = new PostModel() as any

  instance.title = body.title
  instance.content = body.content
  instance.date = new Date()

  instance.save((err: any) => {
    console.info(err)
  })

  ctx.body = '上传成功'
})

router.post('/api/post/:id', async (ctx, next) => {
  if (!ctx.request.body) {
    ctx.status = 400
    return
  }

  const body = ctx.request.body as {
    pwd: string
    title: string
    content: string
  }

  if (!authPwd(body.pwd)) {
    ctx.status = 401
    ctx.body = '别瞎传'
    return
  }

  await new Promise((resolve, reject) => {
    PostModel.updateOne({
      _id: ctx.params.id
    }, ctx.request.body, (err: any) => {
      if (err) {
        ctx.status = 404
      } else {
        ctx.body = '编辑成功'
      }
      resolve()
    })
  })
})

router.get('/api/post/:id', async (ctx, next) => {
  await new Promise((resolve, reject) => {
    PostModel.findById(ctx.params.id, (err, doc: any) => {
      if (err) {
        ctx.status = 404
      } else {
        ctx.body = {
          ...doc.toObject(),
          date: moment(doc.date).format('YYYY年 M月 D日')
        }
      }
      resolve()
    })
  })
})

router.get('/api/posts', async (ctx, next) => {
  await new Promise((resolve, reject) => {
    PostModel.find({}, (err, docs) => {
      if (err) {
        ctx.status = 500
      } else {
        ctx.body = docs.map((doc) => ({
          id: doc._id,
          title: (doc as any).title,
          abstract: (doc as any).content.substr(0, 100)
        }))
      }
      resolve()
    })
  })
})

router.post('/api/message/:id', async (ctx, next) => {
  if (!ctx.request.body) {
    ctx.status = 400
    return
  }

  const body = ctx.request.body as {
    encryptedData: string
    iv: string
    code: string
    user: object
    message: string
  }

  const sessionKey = ''

  const rawResult = await new Promise((resolve, reject) => {
    request({
      uri: 'https://api.weixin.qq.com/sns/jscode2session',
      qs: {
        appid: keys.AppID,
        secret: keys.AppSecret,
        js_code: body.code,
        grant_type: 'authorization_code'
      }
    }, (err, res, resultBody) => {
      resolve(resultBody)
    })
  }) as string

  const result = JSON.parse(rawResult) as {
    session_key: string
  }

  const pc = new WXBizDataCrypt(result.session_key)
  const data = pc.decryptData(body.encryptedData , body.iv)

  if (data.watermark.appid !== keys.AppID ||
    (Math.floor(+ new Date() / 1000) - data.watermark.timestamp > 60 * 60)) {
    ctx.status = 400
    return
  }

  const instance = new MessageModel() as any

  instance.message = body.message
  instance.user = body.user
  instance.date = new Date()
  instance.postId = ctx.params.id

  instance.save((err: any) => {
    console.info(err)
  })

  ctx.body = data
})

router.get('/api/messages/:id', async (ctx, next) => {
  await new Promise((resolve, reject) => {
    MessageModel.find({
      postId: ctx.params.id
    })
    .exec((err, messages) => {
      if (err) {
        ctx.status = 500
      } else {
        ctx.body = messages.map((message: any) => ({
          content: message.message,
          name: message.user.nickName,
          date: moment(message.date).format('MMM DD HH:mm'),
          avatar: message.user.avatarUrl
        }))
      }
      resolve()
    })
  })
})

app
  .use(BodyParser({
    formLimit: '10mb',
    jsonLimit: '10mb'
  }))
  .use(router.routes())
  .use(router.allowedMethods())
app.listen(3000)
