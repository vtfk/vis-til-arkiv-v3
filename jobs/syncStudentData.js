// hent ut data, lagre json, send til neste jobb
const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder, saveJsonDocument, moveToFolder } = require('../lib/fileAndfolderActions')
const path = require('path')
const { rootDirectory, documentDirectoryName, p360 } = require('../config')
const axios = require('axios')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}`

    const jsons = getFilesInFolder(`${jobDir}/syncStudentData`, 'json')
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object

      if (!json.documentData) throw new Error(`${jsonFile} is missing required property "documentData", something is not right`)
      if (!json.documentData.ssn && !(json.documentData.birthdate && json.documentData.firstName && json.documentData.lastName)) throw new Error(`${jsonFile} is missing required property "documentData.ssn" or ("documentData.birthdate" and "documentData.firstName" and "documentData.lastName"), something is not right`)
      const studentIdentifer = json.documentData.ssn ? { ssn: json.documentData.ssn } : { birthdate: json.documentData.birthdate, firstName: json.documentData.firstName, lastName: json.documentData.lastName }

      try {
        const syncElevmappeRes = await axios.post(p360.syncElevmappeUrl, studentIdentifer, { headers: { [p360.syncElevmappeHeaderName]: p360.syncElevmappeKey } })
        moveToFolder(`${jobDir}/syncStudentData/${json.pdf}`, `${jobDir}/getArchiveMetadata`)
        moveToFolder(jsonFile, `${jobDir}/getArchiveMetadata`)
        const jsonWrite = {
          ...json,
          ...syncElevmappeRes.data
        }
        saveJsonDocument(`${jobDir}/getArchiveMetadata/${path.basename(jsonFile).substring(0, path.basename(jsonFile).lastIndexOf('.'))}.json`, jsonWrite)
      } catch (error) {
        console.log(error)
        // Continue and set retry count
      }
    }
  }
}
