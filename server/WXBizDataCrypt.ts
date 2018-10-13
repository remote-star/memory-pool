import * as crypto from 'crypto'

export default class WXBizDataCrypt {
  private sessionKey = ''

  constructor(sessionKey: string) {
    this.sessionKey = sessionKey
  }

  public decryptData(encryptedData: string, iv: string) {
    // base64 decode
    const sessionKey = new Buffer(this.sessionKey, 'base64')
    const encryptedDataBuffer = new Buffer(encryptedData, 'base64')
    const ivBuffer = new Buffer(iv, 'base64')

    let decoded

    try {
       // 解密
      const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, ivBuffer)
      // 设置自动 padding 为 true，删除填充补位
      decipher.setAutoPadding(true)
      decoded = decipher.update(encryptedDataBuffer, 'binary', 'utf8')
      decoded += decipher.final('utf8')

      decoded = JSON.parse(decoded)

    } catch (err) {
      throw new Error('Illegal Buffer')
    }

    return decoded
  }
}
