// hent ut data, lagre json, send til neste jobb
const { archiveMethods } = require('../archiveMethods')
const pdfReader = require('@vtfk/pdf-text-reader')
const findDocumentData = require('../lib/findDocumentData')
const { getFilesInFolder, moveToFolder, saveJsonDocument } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError } = require('../lib/jobTools')
const { logger } = require('@vtfk/logger')
const path = require('path')
const { rootDirectory, documentDirectoryName } = require('../config')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/getData`
    const pdfs = getFilesInFolder(jobDir, 'pdf')
    for (const pdf of pdfs) { // For each pdf of the document type
      const pdfData = {
        pdf: path.basename(pdf),
        retries: 0
      }
      try { // Get pdf content
        const pdfContent = await pdfReader(pdf)
        pdfData.pdfText = pdfContent.textContent.map(ele => ele.str)
      } catch (error) {
        await handleError(pdfData, false, jobDir, 'Failed when reading pdf', error, false)
        continue
      }
      try { // Get relevant data from the pdf
        pdfData.documentData = findDocumentData[options.findDataMethod](method, pdfData.pdfText)
        if (pdfData.documentData.split) {
          logger('info', ['Vis-til-Arkiv', `Found several documents of type ${options.name} in ${pdf}, will send to split-job`])
          moveToFolder(pdf, `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/splitDocuments`)
        } else {
          // Get data
          const jsonData = {
            pdf: pdfData.pdf,
            retries: 0
          }
          try {
            pdfData.documentData = await findDocumentData[options.findDataMethod](method, pdfData.pdfText)
            jsonData.documentData = pdfData.documentData
            if (pdfData.pdf.charAt(pdfData.pdf.lastIndexOf('.') - 1) !== 'M') jsonData.documentData.split = true // Quick fix - not splitted ends with "M"
            moveToNextJob(jsonData, false, jobDir, 'createE18job')
          } catch (error) {
            if (pdfData.pdf.charAt(pdfData.pdf.lastIndexOf('.') - 1) !== 'M') jsonData.documentData.split = true // Quick fix - not splitted ends with "M"
            await handleError(jsonData, false, jobDir, 'Failed when finding documentData', error, false)
            continue
          }
        }
      } catch (error) {
        await handleError(pdfData, false, jobDir, 'Failed when reading pdf', error, false)
        continue
      }
    }
  }
}
