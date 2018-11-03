import * as mongoose from 'mongoose'

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
  date: Date,
  video: String
})

export const PostModel = mongoose.model('post', BlogPost)

const BlogMessageReply = new Schema({
  id: ObjectId,
  message: String,
  date: Date,
  user: Object
})

export const MessageReplyModel = mongoose.model('message-reply', BlogMessageReply)

const BlogMessage = new Schema({
  id: ObjectId,
  postId: String,
  message: String,
  date: Date,
  user: Object,
  replies: [BlogMessageReply]
})

export const MessageModel = mongoose.model('message', BlogMessage)
