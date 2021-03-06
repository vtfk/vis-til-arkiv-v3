const fs = require('fs')
const path = require('path')
const { email, rootDirectory, documentDirectoryName } = require('../config')
const { archiveMethods } = require('../archiveMethods')

module.exports = {
  getFilesInFolder: (dir, fileExt) => {
    if (!dir) throw new Error('Missing required parameter "dir"')
    const listOfFiles = []
    if (!fs.existsSync(dir)) {
      return listOfFiles
    }
    fs.readdirSync(dir).forEach(file => {
      if (path.extname(file).toLowerCase() === `.${fileExt}`) listOfFiles.push(`${dir}/${file}`)
    })
    return listOfFiles
  },
  moveToFolder: (fileDest, toFolder) => {
    if (!fileDest && !toFolder) throw new Error('Missing required parameters "dir" and "toFolder"')
    if (!fs.existsSync(toFolder)) fs.mkdirSync(toFolder)
    fs.renameSync(fileDest, `${toFolder}/${path.basename(fileDest)}`)
  },
  getEmailFromFileName: (file) => {
    if (!file) throw new Error('Missing required parameter "file"')
    const emailList = file.split(email.fileNameEmailSeparator).filter(ele => ele.includes('@'))
    if (emailList.length === 1) {
      return emailList[0].trim()
    } else {
      throw new Error(`Could not find email in filename: ${file}`)
    }
  },
  getFileName: (file) => {
    if (!file) throw new Error('Missing required parameter "file"')
    const filenameWithPath = file.split(email.fileNameEmailSeparator)[0] // aah, but what if filename is not the first element in the list...
    const filenameList = filenameWithPath.split('/')
    const filename = filenameList.pop()
    return filename
  },
  getDocumentTypeDir: (docType, withoutRoot) => {
    if (withoutRoot) return `/${documentDirectoryName}/${docType}-${archiveMethods[docType].archiveTemplate}`
    return `${rootDirectory}/${documentDirectoryName}/${docType}-${archiveMethods[docType].archiveTemplate}`
  },
  createSubFolder: (folderName) => {
    if (!fs.existsSync(`${rootDirectory}/${folderName}`)) fs.mkdirSync(`${rootDirectory}/${folderName}`)
  },
  convertToBase64: (file) => {
    return Buffer.from(fs.readFileSync(file)).toString('base64')
  },
  saveJsonDocument: (filename, obj) => {
    // Maybe some validation here someday?
    fs.writeFileSync(filename, JSON.stringify(obj, null, 2))
    return filename
  },
  copyFile: (file, toDir) => {
    fs.copyFileSync(file, `${toDir}/${path.basename(file)}`)
  }
}
