"use strict"

const guid = require("guid")
const moment = require("moment")
const fs = require("fs")
const path = require("path")
const md5File = require('md5-file/promise')
const md5 = require('md5')
const mime = require('mime-types')
const crypto = require('crypto')

class Handler{

  async initFirst(){
    this.global.setup = await new Promise((r) => fs.readFile(path.join(__dirname, "setup.json"), "utf-8", (err, file) => r(JSON.parse(file))))

    if(!this.global.setup.baseurl)
      this.global.setup.baseurl = "http://localhost"

      this.global.setup.storagepath = path.resolve(this.global.setup.storagepath)
  }

  async download(hash){
    let filename = path.join(this.global.setup.storagepath, hash)
    let isFile = await new Promise((r) => fs.lstat(filename, (err, stats) => r(err ? false : stats.isFile(filename))))

    if(!isFile)
      throw "Unknown file"

    return {name: hash, path: filename}
  }

  async raw(hash){
    let filename = path.join(this.global.setup.storagepath, hash)
    let isFile = await new Promise((r) => fs.lstat(filename, (err, stats) => r(err ? false : stats.isFile(filename))))

    if(!isFile)
      throw "Unknown file"

    let meta = await this.getMeta(hash)

    this.request.res.setHeader("Content-Disposition", 'inline; filename="'+meta.filename+'"')
    this.request.res.setHeader("Content-Type", meta.mime)
    this.request.res.sendFile(filename)
  }

  async file(hash){
    let filename = path.join(this.global.setup.storagepath, hash)
    let isFile = await new Promise((r) => fs.lstat(filename, (err, stats) => r(err ? false : stats.isFile(filename))))

    if(!isFile)
      throw "Unknown file"

    let meta = await this.getMeta(hash)

    return {
      hash: hash,
      filename: meta ? meta.filename : null,
      mime: meta ? meta.mime : null,
      size: meta ? meta.size : null,
      links: {
        raw: `${this.global.setup.baseurl}/api/raw/${hash}`,
        download: `${this.global.setup.baseurl}/api/download/${hash}`,
        self: `${this.global.setup.baseurl}/api/file/${hash}`
      }
    }
  }

  async upload(){
    let files = []
    for(let filedef in this.request.req.files){
      let file = this.request.req.files[filedef]

      let hash = crypto
                    .createHash('md5')
                    .update(file.data, 'utf8')
                    .digest('hex')

      let filename = path.join(this.global.setup.storagepath, hash)
      await file.mv(filename)

      let fileSize = await new Promise((r) => fs.lstat(filename, (err, stats) => r(err ? null : stats.size)))
      let metafilename = path.join(this.global.setup.storagepath, `${hash}.json`)
      let meta = {hash: hash, filename: file.name, mime: mime.lookup(file.name), size: fileSize}

      await new Promise((r) => fs.writeFile(metafilename, JSON.stringify(meta), 'utf8', () => r()))
      files.push(await this.file(hash))
    }

    this.cleanup()

    return files
  }

  async getMeta(hash){
    let filename = path.join(this.global.setup.storagepath, hash)
    let metaExists = await new Promise((r) => fs.lstat(filename + ".json", (err, stats) => r(err ? false : stats.isFile(filename + ".json"))))

    let meta = {}
    if(metaExists){
      try{
        meta = JSON.parse(await new Promise((r) => fs.readFile(filename + ".json", 'utf8', (err, data) => r(err ? null : data))))
      }catch(err) {console.log(err)}
    }
    return meta;
  }

  async cleanup(){
    if(this.global.lastCleanup !== undefined && moment().subtract(1, "days").isBefore(this.global.lastCleanup))
      return;

    this.global.lastCleanup = moment()

    let uploadsDir = this.global.setup.storagepath;
    let files = await new Promise((r) => fs.readdir(uploadsDir, (err, files) => r(files)))

    for(let file of files){
      let stat = await new Promise((r) => fs.stat(path.join(uploadsDir, file), (err, stat) => r(stat)))

      let endTime = new Date(stat.ctime).getTime() + (31*24*60*60*1000); //31 days
      let now = new Date().getTime();
      if (now > endTime) {
        fs.unlink(path.join(uploadsDir, file), () => console.log(`Cleanup: Deleted file: ${file}`))
      }
    }
  }
}

module.exports = Handler
