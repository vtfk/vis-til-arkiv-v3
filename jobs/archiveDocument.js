// arkiver, lagre json, send til neste jobb, eller ferdig
const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError, shouldRun } = require('../lib/jobTools')
const { rootDirectory, documentDirectoryName, p360 } = require('../config')
const axios = require('axios')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/archive`

    const jsons = getFilesInFolder(jobDir, 'json')
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object
      if (!shouldRun(json.nextTry)) continue
      try {
        if (!json.metadata) throw new Error(`${jsonFile} is missing required property "metadata", something is not right`)

        const archiveRes = await axios.post(`${p360.archiveDocUrl}${p360.archiveQueryString}${p360.archiveKey}`, { parameter: json.metadata })

        if (!archiveRes.data.Successful) {
          throw new Error(archiveRes.data.ErrorMessage)
        }

        let dest = 'cleanup'
        if (options.svarUt) { // If document is to be sent as well as archived
          dest = 'svarut'
        }
        moveToNextJob({ ...json, archive: archiveRes.data }, jsonFile, jobDir, dest)
      } catch (error) {
        await handleError(json, jsonFile, jobDir, 'Failed when archiving document', error, true)
      }
    }
  }
}
