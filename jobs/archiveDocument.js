// arkiver, lagre json, send til neste jobb, eller ferdig
const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError, shouldRun } = require('../lib/jobTools')
const { rootDirectory, documentDirectoryName } = require('../config')
const { callArchive } = require('../lib/call-archive')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/archive`

    const jsons = getFilesInFolder(jobDir, 'json')
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object
      if (!shouldRun(json.nextTry)) continue
      try {
        if (!json.metadata) throw new Error(`${jsonFile} is missing required property "metadata", something is not right`)

        if (json.documentData.pages && archiveMethods[method].pageLimit && json.documentData.pages > archiveMethods[method].pageLimit) throw new Error(`Number of pages are too much for archivemethod ${method}, with a limit of ${archiveMethods[method].pageLimit}`)

        const archiveRes = await callArchive(json.documentData.schoolCountyNumber, 'Archive', { service: 'DocumentService', method: 'CreateDocument', parameter: json.metadata })

        let dest = 'cleanup'
        if (options.svarUt) { // If document is to be sent as well as archived
          dest = 'svarut'
        }
        moveToNextJob({ ...json, archive: archiveRes }, jsonFile, jobDir, dest)
      } catch (error) {
        await handleError(json, jsonFile, jobDir, 'Failed when archiving document', error, true)
      }
    }
  }
}
