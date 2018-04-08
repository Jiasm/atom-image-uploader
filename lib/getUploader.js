const qiniu = require('qiniu')
const getConfig = require('./getConfig')

module.exports = function () {
  let accessKey = getConfig('access-token')
  let secretKey = getConfig('secret-key')

  if (!accessKey || !secretKey) {
    atom.notifications.addWarning('can not found access-token or secret-key', {dismissable: true})
    return false
  }

  let mac = new qiniu.auth.digest.Mac(accessKey, secretKey)
  let config = new qiniu.conf.Config()
  config.zone = qiniu.zone[getConfig('zone')]
  let domain = getConfig('domain')
  let options = {
    scope: getConfig('bucket')
  }
  let putPolicy = new qiniu.rs.PutPolicy(options)
  let uploadToken = putPolicy.uploadToken(mac)

  return ({path, key}) => {
    return new Promise((resolve, reject) => {
      var formUploader = new qiniu.form_up.FormUploader(config)
      var putExtra = new qiniu.form_up.PutExtra()

      formUploader.putFile(uploadToken, key, path, putExtra, function (respErr,
        respBody, respInfo) {
        if (respErr) {
          throw respErr
        }
        if (respInfo.statusCode === 200) {
          console.log(`upload success: ${domain}/${key}`)
          let url = domain + '/' + key
          resolve(url)
          atom.notifications.addSuccess(`upload success:<br/>${url}`, {dismissable: true})
        } else {
          console.log(respInfo.statusCode)

          console.log(respBody)
          atom.notifications.addError(`upload error with code: ${respInfo.statusCode}`, {dismissable: true})
          reject(new Error('upload error'))
        }
      })
    })
  }
}
