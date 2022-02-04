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

      if (!json.e18jobId) {
        try {
          if (!json.archive) throw new Error(`${jsonFile} is missing required property "archive", something is not right`)
          // Post stats to E18
          const svarutRes = ('svarut' in json) ? json.svarut : false
          const e18job = {
            e18: false,
            projectId: 162,
            system: 'vis-til-arkiv',
            tasks: [
              {
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
            ],
            type: 'Arkivering'
          }
          const e18Res = await axios.post(`${e18.url}/jobs`, e18job, { headers: { [e18.headerName]: e18.key } })
          json.e18jobId = e18Res.data._id
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
