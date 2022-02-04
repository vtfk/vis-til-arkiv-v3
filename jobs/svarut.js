// arkiver, lagre json, send til neste jobb, eller ferdig
const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder, convertToBase64, getEmailFromFileName } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError, shouldRun } = require('../lib/jobTools')
const { rootDirectory, documentDirectoryName, p360 } = require('../config')
const { teamsWarn } = require('../lib/teamsActions')
const createMetadata = require('../lib/createMetadata')
const { logger } = require('@vtfk/logger')
const axios = require('axios')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/svarut`

    const jsons = getFilesInFolder(jobDir, 'json')
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object
      if (!shouldRun(json.nextTry)) continue

      const addressBlockCodes = [4, 6, 7]
      if (addressBlockCodes.includes(json.privatePerson.addressCode)) {
        try { // Create internal note and send to responsible unit
          if (!json.archive) throw new Error(`${jsonFile} is missing required property "archive", something is not right`)
          if (!json.archive.DocumentNumber) throw new Error(`${jsonFile} is missing required property "archive.DocumentNumber", something is not right`)

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
          moveToNextJob({ ...json, svarut: 'internalNote', internalNote: internalNoteRes.data }, jsonFile, jobDir, 'cleanup')
        } catch (error) {
          await handleError(json, jsonFile, jobDir, 'Failed when creating internal note', error, true)
        }
      } else {
        try {
          if (!json.archive) throw new Error(`${jsonFile} is missing required property "archive", something is not right`)
          if (!json.archive.DocumentNumber) throw new Error(`${jsonFile} is missing required property "archive.DocumentNumber", something is not right`)

          if (options.manualSvarUt) {
            // post a teams message, that it needs to be manually dispatched
            logger('warn', ['Vis-til-Arkiv', `Document ${json.archive.DocumentNumber} must be sent manually on SvarUT`, json.pdf, 'Noen must send this manually'])
            await teamsWarn(`Document ${json.archive.DocumentNumber} must be sent manually on SvarUT`, json.pdf, 'Noen must send this manually')
            moveToNextJob({ ...json, svarut: 'manual' }, jsonFile, jobDir, 'cleanup')
          } else {
            const svarutRes = await axios.post(`${p360.dispatchDocUrl}${p360.archiveQueryString}${p360.archiveKey}`, { parameter: { Documents: [{ DocumentNumber: json.archive.DocumentNumber }] } })

            if (!svarutRes.data.Successful) {
              throw new Error(svarutRes.data.ErrorMessage)
            }
            moveToNextJob({ ...json, svarut: true }, jsonFile, jobDir, 'cleanup')
          }
        } catch (error) {
          await handleError(json, jsonFile, jobDir, 'Failed when sending on SvarUT', error, true)
        }
      }
    }
  }
}
