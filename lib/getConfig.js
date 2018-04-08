const qnConfigPre = 'atom-image-uploader.qiniu-'

module.exports = function getConfig (key) {
  return atom.config.get(qnConfigPre + key)
}
