const path = require('path')
const { moveToFolder, saveJsonDocument } = require('./fileAndfolderActions')
const { teamsError } = require('./teamsActions')
const { retryCount } = require('../config')
const { logger } = require('@vtfk/logger')

module.exports = {
  moveToNextJob: (jsonRes, jsonFile, jobDir, nextJob) => {
    moveToFolder(`${jobDir}/${jsonRes.pdf}`, `${jobDir.substring(0, jobDir.lastIndexOf('/'))}/${nextJob}`)
    if (jsonFile) moveToFolder(jsonFile, `${jobDir.substring(0, jobDir.lastIndexOf('/'))}/${nextJob}`)
    saveJsonDocument(`${jobDir.substring(0, jobDir.lastIndexOf('/'))}/${nextJob}/${path.basename(jsonRes.pdf).substring(0, path.basename(jsonRes.pdf).lastIndexOf('.'))}.json`, jsonRes)
    logger('info', ['Vis-til-Arkiv', `Job "${jobDir.substring(jobDir.lastIndexOf('/')+1, jobDir.length)}" succeded :), moved files to next job: "${nextJob}"`, jsonRes.pdf])
  },
  handleError: async (jsonRes, jsonFile, jobDir, error) => {
    if (jsonRes.retries > retryCount) {
      moveToFolder(`${jobDir}/${jsonRes.pdf}`, `${jobDir}/error`)
      moveToFolder(jsonFile, `${jobDir}/error`)
      saveJsonDocument(`${jobDir}/error/${path.basename(jsonFile).substring(0, path.basename(jsonFile).lastIndexOf('.'))}.json`, jsonRes)
      logger('error', ['Vis-til-Arkiv', `Failed in job ${jobDir.substring(jobDir.lastIndexOf('/')+1, jobDir.length)}. Have tried ${retryCount} times now, won't do it again...`, jsonFile, error.toString()])
      await teamsError(`Failed in job ${jobDir.substring(jobDir.lastIndexOf('/')+1, jobDir.length)}. Have tried ${retryCount} times now, won't do it again...`, jsonFile, error)
    }
  }
}