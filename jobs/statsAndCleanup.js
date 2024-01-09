const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError, shouldRun, writeLocalStats } = require('../lib/jobTools')
const { teamsError } = require('../lib/teamsActions')
const { rootDirectory, documentDirectoryName, e18, deleteFinishedJobs, originalsDirectoryName } = require('../config')
const { logger } = require('@vtfk/logger')
const fs = require('fs')
const path = require('path')

module.exports = async () => {
  const stats = {} // Initialize stats for the job
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/cleanUp`
    const jsons = getFilesInFolder(jobDir, 'json')
    stats[method] = { imported: 0 }
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object

      if (!shouldRun(json.nextTry)) continue

      // Increase stats for documentType
      stats[method].imported++
      // Delete files
      if (deleteFinishedJobs === 'true') {
        try {
          fs.unlinkSync(`${jobDir}/${json.pdf}`)
          fs.unlinkSync(jsonFile)
          if (json.documentData.ocr) fs.unlinkSync(`${rootDirectory}/${originalsDirectoryName}/${path.basename(json.pdf)}`)
          await logger('info', ['Vis-til-Arkiv', `Done with ${jsonFile}, all good - deleted jobfiles.`])
        } catch (error) {
          await teamsError('Failed when deleting finished job', jsonFile, error)
          await logger('error', ['Vis-til-Arkiv', 'error when deleting finished files', error])
        }
      } else {
        moveToNextJob(json, jsonFile, jobDir, 'imported')
        if (json.documentData.ocr) fs.renameSync(`${rootDirectory}/${originalsDirectoryName}/${path.basename(json.pdf)}`, `${jobDir.substring(0, jobDir.lastIndexOf('/'))}/imported/${path.basename(json.pdf).substring(0, path.basename(json.pdf).lastIndexOf('.'))}-ORIGINAL.pdf`) // Holy shit
      }
    }
  }
  try {
    writeLocalStats(stats)
  } catch (error) {
    await logger('error', ['Vis-til-Arkiv', 'error when writing local stats', error])
  }
}
