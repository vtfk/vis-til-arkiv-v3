// hent ut data, lagre json, send til neste jobb
const { archiveMethods } = require('../archiveMethods')
const pdfReader = require('@vtfk/pdf-text-reader')
const findDocumentData = require('../lib/findDocumentData')
const { getFilesInFolder, moveToFolder, getEmailFromFileName } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError } = require('../lib/jobTools')
const { logger } = require('@vtfk/logger')
const path = require('path')
const { rootDirectory, documentDirectoryName } = require('../config')
const correctSpelling = require('../lib/correctSpelling')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/ocrGetData`
    const pdfs = getFilesInFolder(jobDir, 'pdf')
    for (const pdf of pdfs) { // For each pdf of the document type
      const pdfData = {
        pdf: path.basename(pdf),
        retries: 0,
        pages: []
      }
      try { // Get pdf content
        const pdfContent = await pdfReader(pdf, { inferLines: { normalizeY: true } }) // read pdf
        pdfContent.textContent.forEach(ele => { if (!pdfData.pages.includes(ele.page)) pdfData.pages.push(ele.page) })
        let pdfStrings = Object.values(pdfContent.lines) // Fetch all the lines as string values
        pdfStrings = pdfStrings.map(str => str.replace(/[^a-zA-Z0-9ÆØÅæøå:.,\-\/ ]/g, '')) // Remove characters we do not need
        pdfStrings = pdfStrings.map(str => str.replace(/\s\s+/g, ' ').trim()) // Remove multiple whitespace possibly created by previous line
        pdfStrings = pdfStrings.map(str => correctSpelling(str))
        pdfData.pdfText = pdfStrings
      } catch (error) {
        await handleError(pdfData, false, jobDir, 'Failed when reading pdf', error, false)
        continue
      }
      try { // Get relevant data from the pdf
        const userEmail = getEmailFromFileName(pdf)
        pdfData.documentData = findDocumentData[options.findDataMethod](method, pdfData.pdfText, userEmail)
        if (pdfData.documentData.split) {
          logger('info', ['Vis-til-Arkiv', `Found several documents of type ${options.name} in ${pdf}, will send to split-job`])
          moveToFolder(pdf, `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/ocrSplitDocuments`)
        } else {
          // Get data
          const jsonData = {
            pdf: pdfData.pdf,
            retries: 0
          }
          try {
            // pdfData.documentData = await findDocumentData[options.findDataMethod](method, pdfData.pdfText)
            jsonData.documentData = { ...pdfData.documentData, ocr: true, pages: pdfData.pages.length }
            if (pdfData.pdf.charAt(pdfData.pdf.lastIndexOf('.') - 1) !== 'M') jsonData.documentData.split = true // Quick fix - not splitted ends with "M"
            moveToNextJob(jsonData, false, jobDir, 'createE18job')
          } catch (error) {
            jsonData.documentData = { ocr: true, pages: pdfData.pages.length, ssn: 'manual', firstName: 'manual', lastName: 'manual', school: 'manual', course: 'manual', schoolOrgNr: 'manual', schoolAccessGroup: 'manual', documentDate: 'manual', schoolYear: 'manual', type: 'manual' }
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
