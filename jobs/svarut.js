// arkiver, lagre json, send til neste jobb, eller ferdig
const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder, convertToBase64, getEmailFromFileName } = require('../lib/fileAndfolderActions')
const { moveToNextJob } = require('../lib/jobTools')
const { rootDirectory, documentDirectoryName, p360 } = require('../config')
const createMetadata = require('../lib/createMetadata')
const axios = require('axios')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/svarut`

    const jsons = getFilesInFolder(jobDir, 'json')
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object

      if (!json.archive) throw new Error(`${jsonFile} is missing required property "archive", something is not right`)
      if (!json.archive.DocumentNumber) throw new Error(`${jsonFile} is missing required property "archive.DocumentNumber", something is not right`)

      const addressBlockCodes = [4, 6, 7]
      if (addressBlockCodes.includes(json.privatePerson.addressCode)) {
        try { // Create internal note and send to responsible unit
          const internalNoteData = {
            template: require(`../templates/${options.internalNoteTemplate}.json`),
            documentData: {
              documentNumber: json.archive.DocumentNumber,
              studentName: `${json.privatePerson.firstName} ${json.privatePerson.lastName}`,
              elevmappeCaseNumber: json.elevmappe.CaseNumber,
              schoolAccessGroup: json.documentData.schoolAccessGroup,
              schoolOrgNr: json.documentData.schoolOrgnr,
              userEmailAddress: getEmailFromFileName(json.pdf),
              pdfFileBase64: convertToBase64(options.internalNote)
            }
          }
          const internalNoteMetadata = createMetadata(internalNoteData)
          const internalNoteRes = await axios.post(`${p360.archiveDocUrl}${p360.archiveQueryString}${p360.archiveKey}`, { parameter: internalNoteMetadata })

          if (!internalNoteRes.data.Successful) {
            throw new Error(internalNoteRes.data.ErrorMessage)
          }
          moveToNextJob({ ...json, svarut: false, internalNote: internalNoteRes.data }, jsonFile, jobDir, 'imported')

        } catch (error) {
          console.log(error)
        }
      } else {
        try {
          if (options.manualSvarUt) {
            // post a teams message, that it needs to be manually dispatched
          } else {
            const svarutRes = await axios.post(`${p360.dispatchDocUrl}${p360.archiveQueryString}${p360.archiveKey}`, { parameter: { Documents: [{ DocumentNumber: json.archive.DocumentNumber }] } })

            if (!svarutRes.data.Successful) {
              throw new Error(svarutRes.data.ErrorMessage)
            }
            moveToNextJob({ ...json, svarut: svarutRes.data }, jsonFile, jobDir, 'imported')
          }

        } catch (error) {
          console.log(error)
          // Continue and set retry count
        }
      }
    }
  }
}
