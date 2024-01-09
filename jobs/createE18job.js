// hent ut data, lagre json, send til neste jobb
const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError, shouldRun } = require('../lib/jobTools')
const { rootDirectory, documentDirectoryName } = require('../config')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/createE18job`

    const jsons = getFilesInFolder(jobDir, 'json')
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object

      if (!shouldRun(json.nextTry)) continue

      if (!json.e18jobId) {
        try {
          // Create job on E18
          const e18job = {
            e18: false,
            projectId: 162,
            system: 'vis-til-arkiv',
            tasks: [
            ],
            type: 'Arkivering'
          }
          // Haha nope... const e18Res = await axios.post(`${e18.url}/jobs`, e18job, { headers: { [e18.headerName]: e18.key } })
          json.e18jobId = 'notinuse'
          moveToNextJob(json, jsonFile, jobDir, 'syncStudentData')
        } catch (error) {
          await handleError(json, jsonFile, jobDir, 'Failed when creating job on E18', error, true)
        }
      }
    }
  }
}
