'use babel'

import { CompositeDisposable } from 'atom'
import { clipboard } from 'electron'
import fs from 'fs'
import path from 'path'
import getConfig from './getConfig'
import getUploader from './getUploader'

export default {

  atomImageUploaderView: null,
  modalPanel: null,
  subscriptions: null,

  activate (state) {
    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable()

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'atom-image-uploader:toggle': () => this.toggle()
    }))
  },

  getSuggestions (request) {
    // console.log('request', request)
  },

  deactivate () {
    // console.log('deactivate')
  },

  serialize () {
  },

  toggle () {
    let editor = atom.workspace.getActiveTextEditor()
    if (editor.getPath().substr(-3) !== '.md') return // only supports markdown files

    let tempFilePath = null
    let removeFile = () => tempFilePath && fs.unlinkSync(tempFilePath)
    try {
      if (clipboard.readImage().isEmpty()) return // not image

      let suffix = clipboard.readText().replace(/(.*)+(?=\.)/, '')

      // electron clipboard can not supports gifs
      let buffer = null
      switch (suffix) {
        case '.jpg':
        case '.jpeg':
          buffer = clipboard.readImage().toJpeg(100)
          break
        case '.png':
        default:
          buffer = clipboard.readImage().toPng()
      }
      let randomFileName = (Math.random() * 1e6 | 0).toString(32) + (suffix || '.png')
      tempFilePath = path.join(__dirname, randomFileName)

      let placeHolderText = `uploading-${randomFileName}`

      // add placeholder
      editor.insertText(`![](${placeHolderText})`, editor)

      fs.writeFileSync(tempFilePath, Buffer.from(buffer))

      let uploader = getUploader()

      if (!uploader) return

      let preKey = getConfig('pre-key').replace(/^\/|\/$/g, '')

      uploader({
        key: (preKey ? preKey + '/' : '') + randomFileName,
        path: tempFilePath
      }).then(url => {
        // upload complete
        // replace placeholder
        editor.scan(new RegExp(placeHolderText), tools => tools.replace(url))

        // remove temp files
        removeFile()
      }, err => {
        console.error(err)
        editor.scan(new RegExp(placeHolderText), tools => tools.replace('upload error'))
        removeFile()
      })
    } catch (e) {
      console.error(e)
      removeFile()
    }
  }
}
