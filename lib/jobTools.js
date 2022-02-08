const path = require('path')
const fs = require('fs')
const { moveToFolder, saveJsonDocument } = require('./fileAndfolderActions')
const { teamsError } = require('./teamsActions')
const { retryCount, retryTime, statFile } = require('../config')
const { logger } = require('@vtfk/logger')

module.exports = {
  moveToNextJob: (jsonRes, jsonFile, jobDir, nextJob) => {
    moveToFolder(`${jobDir}/${jsonRes.pdf}`, `${jobDir.substring(0, jobDir.lastIndexOf('/'))}/${nextJob}`)
    if (jsonFile) moveToFolder(jsonFile, `${jobDir.substring(0, jobDir.lastIndexOf('/'))}/${nextJob}`)
    saveJsonDocument(`${jobDir.substring(0, jobDir.lastIndexOf('/'))}/${nextJob}/${path.basename(jsonRes.pdf).substring(0, path.basename(jsonRes.pdf).lastIndexOf('.'))}.json`, { ...jsonRes, retries: 0, nextTry: false })
    logger('info', ['Vis-til-Arkiv', `Job "${jobDir.substring(jobDir.lastIndexOf('/') + 1, jobDir.length)}" succeded :), moved files to next job: "${nextJob}"`, jsonRes.pdf])
  },
  handleError: async (jsonRes, jsonFile, jobDir, msg, error, retry) => {
    if ((jsonRes.retries >= retryCount) || !retry) {
      moveToFolder(`${jobDir}/${jsonRes.pdf}`, `${jobDir}/error`)
      if (jsonFile) moveToFolder(jsonFile, `${jobDir}/error`)
      saveJsonDocument(`${jobDir}/error/${path.basename(jsonRes.pdf).substring(0, path.basename(jsonRes.pdf).lastIndexOf('.'))}.json`, { ...jsonRes, lastError: error })
      if (retry) {
        logger('error', ['Vis-til-Arkiv', `Failed in job ${jobDir.substring(jobDir.lastIndexOf('/') + 1, jobDir.length)}. Have retried ${retryCount} times now, won't do it again... MESSAGE: ${msg}`, `FILE: ${jsonRes.pdf}`, `ERROR: ${error}`])
        await teamsError(`Failed in job ${jobDir.substring(jobDir.lastIndexOf('/') + 1, jobDir.length)}. Have retried ${retryCount} times now, won't do it again... MESSAGE: ${msg}`, `FILE: ${jsonRes.pdf}`, `ERROR ${error}`)
      } else {
        logger('error', ['Vis-til-Arkiv', `Failed in job ${jobDir.substring(jobDir.lastIndexOf('/') + 1, jobDir.length)}. Retry is off for this task. MESSAGE: ${msg}`, `FILE: ${jsonRes.pdf}`, `ERROR: ${error}`])
        await teamsError(`Failed in job ${jobDir.substring(jobDir.lastIndexOf('/') + 1, jobDir.length)}. Have retried ${retryCount} Retry is off for this task. MESSAGE: ${msg}`, `FILE: ${jsonRes.pdf}`, `ERROR ${error}`)
      }
    } else {
      const retries = jsonRes.retries || 0
      const nextTry = new Date()
      nextTry.setMinutes(nextTry.getMinutes() + retryTime[retries])
      saveJsonDocument(`${jobDir}/${path.basename(jsonRes.pdf).substring(0, path.basename(jsonRes.pdf).lastIndexOf('.'))}.json`, { ...jsonRes, retries: retries + 1, nextTry: nextTry.toISOString(), lastError: error })
      logger('error', ['Vis-til-Arkiv', `Failed in job ${jobDir.substring(jobDir.lastIndexOf('/') + 1, jobDir.length)}. Have retried ${retries} times now, will try again in ${retryTime[retries]} minutes. MESSAGE: ${msg}`, `FILE: ${jsonRes.pdf}`, `ERROR: ${error}`])
      await teamsError(`Failed in job ${jobDir.substring(jobDir.lastIndexOf('/') + 1, jobDir.length)}. Have retried ${retries} times now, will try again in ${retryTime[retries]} minutes. MESSAGE: ${msg}`, `FILE: ${jsonRes.pdf}`, `ERROR ${error}`)
    }
  },
  shouldRun: (nextTry) => {
    if (!nextTry) return true
    return new Date() > new Date(nextTry)
  },
  writeLocalStats: (statistics) => {
    let stats = {}
    if (fs.existsSync(statFile)) {
      stats = require(statFile)
    }
    for (const [key, value] of Object.entries(statistics)) {
      if (!stats[key]) {
        stats[key] = { imported: value.imported }
      } else {
        stats[key].imported += value.imported
      }
    }
    saveJsonDocument(statFile, stats)
  }
}
