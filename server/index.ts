import * as Koa from 'koa'
import * as Router from 'koa-router'
import * as BodyParser from 'koa-bodyparser'
import * as mongoose from 'mongoose'

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
  const instance = new PostModel() as any
  const body = ctx.request.body as {
    title: string
    content: string
  }

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
    })
  })
})

app
  .use(BodyParser())
  .use(router.routes())
  .use(router.allowedMethods())
app.listen(3000)
