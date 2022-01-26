const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder, convertToBase64 } = require('../lib/fileAndfolderActions')
const { moveToNextJob } = require('../lib/jobTools')
const { rootDirectory, documentDirectoryName } = require('../config')
const createMetadata = require('../lib/createMetadata')

module.exports = () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/getArchiveMetadata`
    const jsons = getFilesInFolder(jobDir, 'json')
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
        console.log(error)
        // Continue and set retry count
      }
    }
  }
}
