import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as BodyParser from 'koa-bodyparser'
import * as mongoose from 'mongoose'

import * as crypto from 'crypto'

const app = new Koa()
const router = new Router()

mongoose.connect('mongodb://127.0.0.1:27017/site', {
  useNewUrlParser: true
}, (err) => {
  if (err) {
    console.log(err)
  }
})
const Schema = mongoose.Schema
const ObjectId = (Schema as any).ObjectId

const BlogPost = new Schema({
  id: ObjectId,
  title: String,
  content: String,
  date: Date
})

const PostModel = mongoose.model('post', BlogPost)

router.post('/api/post', (ctx, next) => {
  if (!ctx.request.body) {
    ctx.status = 400
    return
  }

  const body = ctx.request.body as {
    pwd: string
    title: string
    content: string
  }

  const md5 = crypto.createHash('md5')
  const salt = 'thisIsReallyALofOfSalt'
  md5.update(body.pwd + salt)
  const md5Str = md5.digest('hex')

  if ('25333dfb17252abfb7bd77f91e0fade7' !== md5Str) {
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
  ctx.body = ctx.request.body
})

router.get('/api/post/:id', async (ctx, next) => {
  await new Promise((resolve, reject) => {
    PostModel.findById(ctx.params.id, (err, doc) => {
      if (err) {
        ctx.status = 404
      } else {
        ctx.body = doc
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
        ctx.body = docs
      }
      resolve()
    })
  })
})

app
  .use(BodyParser())
  .use(router.routes())
  .use(router.allowedMethods())
app.listen(3000)
