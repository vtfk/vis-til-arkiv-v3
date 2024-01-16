// arkiver, lagre json, send til neste jobb, eller ferdig
const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder, convertToBase64, getEmailFromFileName } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError, shouldRun } = require('../lib/jobTools')
const { rootDirectory, documentDirectoryName } = require('../config')
const { teamsWarn } = require('../lib/teamsActions')
const createMetadata = require('../lib/createMetadata')
const { logger } = require('@vtfk/logger')
const { callArchive } = require('../lib/call-archive')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/svarut`

    const jsons = getFilesInFolder(jobDir, 'json')
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object
      if (!shouldRun(json.nextTry)) continue

      if (json.privatePerson.addressProtection || json.privatePerson.zipCode.length !== 4) {
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
              schoolOrgNr: json.documentData.schoolOrgNr,
              userEmailAddress: getEmailFromFileName(json.pdf),
              pdfFileBase64: convertToBase64(options.internalNote)
            }
          }
          const internalNoteMetadata = createMetadata(internalNoteData)
          const internalNoteRes = await callArchive(json.documentData.schoolCountyNumber, 'Archive', { service: 'DocumentService', method: 'CreateDocument', parameter: internalNoteMetadata })

          moveToNextJob({ ...json, svarut: 'internalNote', internalNote: internalNoteRes }, jsonFile, jobDir, 'cleanup')
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
            const dispatchPayload = {
              service: 'DocumentService',
              method: 'DispatchDocuments',
              parameter: {
                Documents: [
                  {
                    DocumentNumber: json.archive.DocumentNumber
                  }
                ]
              }
            }
            const dispatchResponse = await callArchive(json.documentData.schoolCountyNumber, 'Archive', dispatchPayload)
            if (!dispatchResponse[0].Successful) {
              throw new Error(`Dispatching of document ${json.archive.DocumentNumber} was not successful! ErrorMessage: ${dispatchResponse[0].ErrorMessage}`)
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
