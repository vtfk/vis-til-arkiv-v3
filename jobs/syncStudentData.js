// hent ut data, lagre json, send til neste jobb
const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError, shouldRun } = require('../lib/jobTools')
const { rootDirectory, documentDirectoryName, p360, e18 } = require('../config')
const axios = require('axios')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/syncStudentData`

    const jsons = getFilesInFolder(jobDir, 'json')
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object
      if (!shouldRun(json.nextTry)) continue
      if (!json.e18taskSyncElevmappeId) {
        try {
          // Post stats to E18
          const e18task = {
            method: 'syncElevmappe',
            system: 'p360'
          }
          const e18Res = await axios.post(`${e18.url}/jobs/${json.e18jobId}/tasks`, e18task, { headers: { [e18.headerName]: e18.key } })
          json.e18taskSyncElevmappeId = e18Res.data._id
          // Delete data, everything is done
        } catch (error) {
          await handleError(json, jsonFile, jobDir, 'Failed when creating task on E18', error, true)
          continue
        }
      }
      try {
        if (!json.documentData) throw new Error(`${jsonFile} is missing required property "documentData", something is not right`)
        if (!json.documentData.ssn && !(json.documentData.birthdate && json.documentData.firstName && json.documentData.lastName)) throw new Error(`${jsonFile} is missing required property "documentData.ssn" or ("documentData.birthdate" and "documentData.firstName" and "documentData.lastName"), something is not right`)
        const studentIdentifer = json.documentData.ssn ? { ssn: json.documentData.ssn } : { birthdate: json.documentData.birthdate, firstName: json.documentData.firstName, lastName: json.documentData.lastName }
        const syncElevmappeRes = await axios.post(p360.syncElevmappeUrl, studentIdentifer, { headers: { [p360.syncElevmappeHeaderName]: p360.syncElevmappeKey, e18jobId: json.e18jobId, e18taskId: json.e18taskSyncElevmappeId } })
        moveToNextJob({ ...json, ...syncElevmappeRes.data }, jsonFile, jobDir, 'getArchiveMetadata')
      } catch (error) {
        await handleError(json, jsonFile, jobDir, 'Failed when synchronizing elevmappe', error, true)
      }
    }
  }
}
