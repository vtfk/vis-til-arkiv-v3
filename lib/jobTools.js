const path = require('path')
const { moveToFolder, saveJsonDocument } = require('./fileAndfolderActions')

module.exports = {
  moveToNextJob: (jsonRes, jsonFile, jobDir, nextJob) => {
    moveToFolder(`${jobDir}/${jsonRes.pdf}`, `${jobDir.substring(0, jobDir.lastIndexOf('/'))}/${nextJob}`)
    moveToFolder(jsonFile, `${jobDir.substring(0, jobDir.lastIndexOf('/'))}/${nextJob}`)
    saveJsonDocument(`${jobDir.substring(0, jobDir.lastIndexOf('/'))}/${nextJob}/${path.basename(jsonFile).substring(0, path.basename(jsonFile).lastIndexOf('.'))}.json`, jsonRes)
  }
}