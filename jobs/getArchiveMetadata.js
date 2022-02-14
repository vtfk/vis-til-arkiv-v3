const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder, convertToBase64 } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError, shouldRun } = require('../lib/jobTools')
const { rootDirectory, documentDirectoryName } = require('../config')
const createMetadata = require('../lib/createMetadata')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/getArchiveMetadata`
    const jsons = getFilesInFolder(jobDir, 'json')
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object
      if (!shouldRun(json.nextTry)) continue
      try {
        if (!json.privatePerson) throw new Error(`${jsonFile} is missing required property "privatePerson", something is not right`)
        if (!json.privatePerson.ssn) throw new Error(`${jsonFile} is missing required property "privatePerson.ssn", something is not right`)

        const metadataInput = {
          template: require(`../templates/${options.archiveTemplate}.json`),
          documentData: {
            ...json.documentData,
            studentName: `${json.privatePerson.firstName} ${json.privatePerson.lastName}`,
            elevmappeCaseNumber: json.elevmappe.CaseNumber,
            ssn: json.privatePerson.ssn,
            pdfFileBase64: convertToBase64(`${jobDir}/${json.pdf}`)
          }
        }

        const metadata = createMetadata(metadataInput)

        // Check if we are to send document as well as archiving - set status to 'R'
        const excludeAddressCodes = [4, 6, 7]
        if (options.svarUt && !excludeAddressCodes.includes(json.privatePerson.addressCode)) {
          metadata.Status = 'R'
        }

        // Check if pdf was split, and we need to convert to pdf/a
        if (json.documentData.split) metadata.Files[0].VersionFormat = 'P'

        moveToNextJob({ ...json, metadata }, jsonFile, jobDir, 'archive')
      } catch (error) {
        await handleError(json, jsonFile, jobDir, 'Failed when getting archiveMetadata', error, true)
      }
    }
  }
}
