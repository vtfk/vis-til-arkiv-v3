const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError, shouldRun, writeLocalStats } = require('../lib/jobTools')
const { teamsError } = require('../lib/teamsActions')
const { rootDirectory, documentDirectoryName, e18, deleteFinishedJobs } = require('../config')
const axios = require('axios')
const { logger } = require('@vtfk/logger')
const fs = require('fs')

module.exports = async () => {
  const stats = {} // Initialize stats for the job
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/cleanUp`
    const jsons = getFilesInFolder(jobDir, 'json')
    stats[method] = { imported: 0 }
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object

      if (!shouldRun(json.nextTry)) continue
      if (!json.e18taskId) {
        try {
          if (!json.archive) throw new Error(`${jsonFile} is missing required property "archive", something is not right`)
          // Post stats to E18
          const svarutRes = ('svarut' in json) ? json.svarut : false
          const e18task = {
            method: options.name,
            regarding: `privatePersonRecno: ${json.privatePerson.recno}`,
            status: 'completed',
            system: 'vis-til-arkiv',
            tags: [
                `dokumenttype: ${json.documentData.documentType}`,
                `p360Title: ${json.metadata.Title}`,
                `svarut: ${svarutRes}`,
                `DocumentNumber: ${json.archive.DocumentNumber}`,
                `pdfName: ${json.pdf}`
            ]
          }
          const e18Res = await axios.post(`${e18.url}/jobs/${json.e18jobId}/tasks`, e18task, { headers: { [e18.headerName]: e18.key } })
          json.e18taskId = e18Res.data._id
          // Delete data, everything is done
        } catch (error) {
          await handleError(json, jsonFile, jobDir, 'Failed when creating job on E18', error, true)
          continue
        }
      }
      try {
        if (!json.archive) throw new Error(`${jsonFile} is missing required property "archive", something is not right`)

        await axios.put(`${e18.url}/jobs/${json.e18jobId}/complete`, {}, { headers: { [e18.headerName]: e18.key } })
      } catch (error) {
        await handleError(json, jsonFile, jobDir, 'Failed when setting job to complete on E18', error, true)
        continue
      }

      // Increase stats for documentType
      stats[method].imported++
      // Delete files
      if (deleteFinishedJobs === 'true') {
        try {
          fs.unlinkSync(`${jobDir}/${json.pdf}`)
          fs.unlinkSync(jsonFile)
          await logger('info', ['Vis-til-Arkiv', `Done with ${jsonFile}, all good - deleted jobfiles.`])
        } catch (error) {
          await teamsError('Failed when deleting finished job', jsonFile, error)
          await logger('error', ['Vis-til-Arkiv', 'error when deleting finished files', error])
        }
      } else {
        moveToNextJob(json, jsonFile, jobDir, 'imported')
      }
    }
  }
  try {
    writeLocalStats(stats)
  } catch (error) {
    await logger('error', ['Vis-til-Arkiv', 'error when writing local stats', error])
  }
}
