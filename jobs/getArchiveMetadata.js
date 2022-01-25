const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder, saveJsonDocument, moveToFolder, convertToBase64 } = require('../lib/fileAndfolderActions')
const path = require('path')
const { rootDirectory, documentDirectoryName } = require('../config')
const createMetadata = require('../lib/createMetadata')

module.exports = () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}`
    const jsons = getFilesInFolder(`${jobDir}/getArchiveMetadata`, 'json')
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object

      if (!json.privatePerson) throw new Error(`${jsonFile} is missing required property "privatePerson", something is not right`)
      if (!json.privatePerson.ssn) throw new Error(`${jsonFile} is missing required property "privatePerson.ssn", something is not right`)

      try {
        const metadataInput = {
          template: require(`../templates/${options.archiveTemplate}.json`),
          documentData: {
            documentDate: json.documentData.documentDate,
            studentName: `${json.privatePerson.firstName} ${json.privatePerson.lastName}`,
            elevmappeCaseNumber: json.elevmappe.CaseNumber,
            schoolAccessGroup: json.documentData.schoolAccessGroup,
            schoolOrgNr: json.documentData.schoolOrgnr,
            ssn: json.privatePerson.ssn,
            pdfFileBase64: convertToBase64(`${jobDir}/getArchiveMetadata/${json.pdf}`)
          }
        }

        const metadata = createMetadata(metadataInput)

        // Check if we are to send document as well as archiving - set status to 'R'
        const excludeAddressCodes = [4, 6, 7]
        if (options.svarUt && !excludeAddressCodes.includes(json.privatePerson.addressCode)) {
          metadata.Status = 'R'
        }

        moveToFolder(`${jobDir}/getArchiveMetadata/${json.pdf}`, `${jobDir}/archive`)
        moveToFolder(jsonFile, `${jobDir}/archive`)
        const jsonWrite = {
          ...json,
          metadata
        }
        saveJsonDocument(`${jobDir}/archive/${path.basename(jsonFile).substring(0, path.basename(jsonFile).lastIndexOf('.'))}.json`, jsonWrite)
      } catch (error) {
        console.log(error)
        // Continue and set retry count
      }
    }
  }
}
