import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as BodyParser from 'koa-bodyparser'
import * as crypto from 'crypto'
import * as request from 'request'
import * as moment from 'moment'
import * as marked from 'marked'
import WXBizDataCrypt from './WXBizDataCrypt'
import keys from '../key'
import { PostModel, MessageModel, MessageReplyModel } from './models'

const app = new Koa()
const router = new Router()

function authPwd(pwd: string) {
  if (!pwd) {
    return false
  }

  const md5 = crypto.createHash('md5')
  const salt = 'thisIsReallyALofOfSalt'
  md5.update(pwd + salt)
  const md5Str = md5.digest('hex')

  return '25333dfb17252abfb7bd77f91e0fade7' === md5Str
}

function selectPicture(content: string) {
  const reg = /!\[.*\]\((.*)\)/g
  const urls = []

  let match = reg.exec(content)
  while (match) {
    urls.push(match[1])
    match = reg.exec(content)
  }

  return urls[Math.floor(Math.random() * urls.length)]
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
    video: string
    date: number
  }

  if (!authPwd(body.pwd)) {
    ctx.status = 401
    ctx.body = '别瞎传'
    return
  }

  const instance = new PostModel() as any

  instance.title = body.title
  instance.content = body.content
  instance.video = body.video
  instance.date = body.date || +new Date()

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

  const pwd = (ctx.request.body as any).pwd

  if (!authPwd(pwd)) {
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
          // content: marked(doc.content
          //   .replace(/[^!]\[(.*)\]\(.*\)/g, '$1'))
          //   .replace(/<p>(<img .*)<\/p>/g, '$1')
          //   .replace(/<p>(<audio .*)<\/p>/g, '$1')
          //   .replace(/<img (.*) alt="(.*)">/g, '<img $1 alt=""><p class="tip">$2</p>')
          //   .split(/<h1 id="-">(.*)<\/h1>/g),
          date: moment(doc.date).format('YYYY年 M月 D日')
        }
      }
      resolve()
    })
  })
})

router.delete('/api/post/:id', async (ctx, next) => {

  const pwd = (ctx.request.body as any).pwd

  if (!authPwd(pwd)) {
    ctx.status = 401
    ctx.body = '别闹'
    return
  }

  await new Promise((resolve, reject) => {
    PostModel.deleteOne({
      _id: ctx.params.id
    }, (err) => {
      if (err) {
        ctx.status = 404
      } else {
        ctx.body = {}
      }
      resolve()
    })
  })
})

router.get('/api/posts', async (ctx, next) => {
  await new Promise((resolve, reject) => {
    PostModel.find({})
    .sort('-date')
    .exec((err, docs) => {
      if (err) {
        ctx.status = 500
      } else {
        ctx.body = docs.map((doc) => {
          const obj = doc.toObject()

          if (obj.content) {
            obj.pic = selectPicture(obj.content)
            delete obj.content
          }
          obj.date = moment(obj.date).format('YYYY年 M月 D日')

          return obj
        })
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
    target?: {
      id: string
      user: object
      message: string
    }
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

  if (!body.target) {
    const instance = new MessageModel() as any

    instance.message = body.message
    instance.user = body.user
    instance.date = new Date()
    instance.postId = ctx.params.id

    await new Promise((resolve, reject) => {
      instance.save((err: any) => {
        if (err) {
          ctx.status = 404
        } else {
          ctx.body = '上传成功'
        }
        resolve()
      })
    })
  } else {
    await new Promise((resolve, reject) => {
      MessageModel.findById(body.target!.id, (err, doc: any) => {
        if (err) {
          ctx.status = 404
          resolve()
        } else {
          if (!doc.replies) {
            doc.replies = []
          }
          doc.replies.push({
            content: body.message,
            user: body.user,
            date: new Date()
          })
          doc.save((e: any) => {
            if (e) {
              ctx.status = 404
            } else {
              ctx.body = '上传成功'
            }
            resolve()
          })
        }
      })
    })
  }
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
          id: message._id,
          content: message.message,
          name: message.user.nickName,
          date: moment(message.date).format('MMM DD HH:mm'),
          avatar: message.user.avatarUrl,
          replies: (message.replies || []).map((m: any) => ({
            content: m.message,
            name: m.user.nickName,
            date: moment(m.date).format('MMM DD HH:mm'),
            avatar: m.user.avatarUrl
          }))
        }))
      }
      resolve()
    })
  })
})

router.delete('/api/message/:id', async (ctx, next) => {

  const pwd = (ctx.request.body as any).pwd

  if (!authPwd(pwd)) {
    ctx.status = 401
    ctx.body = '别闹'
    return
  }

  await new Promise((resolve, reject) => {
    MessageModel.deleteOne({
      _id: ctx.params.id
    }, (err) => {
      if (err) {
        ctx.status = 404
      } else {
        ctx.body = {}
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
