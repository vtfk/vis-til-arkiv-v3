// hent ut data, lagre json, send til neste jobb
const { archiveMethods } = require('../archiveMethods')
const pdfReader = require('@vtfk/pdf-text-reader')
const findDocumentData = require('../lib/findDocumentData')
const { getFilesInFolder, moveToFolder, saveJsonDocument } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError } = require('../lib/jobTools')
const { teamsError } = require('../lib/teamsActions')
const { logger } = require('@vtfk/logger')
const splitPdf = require('@vtfk/pdf-splitter')
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
          const pdfToSplit = {
            pdf,
            keywords: options.splitStrings
            // outputDir: `${jobDir}` // Optional, defaults to directory of the input pdf, thats fine in this case :)
          }
          let result
          try {
            logger('info', ['Vis-til-Arkiv', `Olala, found several ${options.name} in one document! Will try to split ${pdf}`])
            result = await splitPdf(pdfToSplit)
          } catch (error) {
            await handleError(pdfData, false, jobDir, 'Failed when splitting pdf', error, false)
            continue
          }
          if (result.failed.length > 0) {
            // Move splitted pdf to failed folder
            logger('error', ['Vis-til-Arkiv', `Could not split ${pdf} correctly, check "${jobDir}/failedSplitted" for more info`])
            await teamsError(`Could not split ${pdf} correctly, check "${jobDir}/failedSplitted" for more info`, pdf, 'WHHHOOOOps')
            moveToFolder(pdf, `${jobDir}/failedSplitted`)
            saveJsonDocument(`${jobDir}/failedSplitted/${path.basename(pdf).substring(0, path.basename(pdf).lastIndexOf('.'))}.json`, { pdf, result }) // Lagre json med info om hva som feila i splittinga
          } else {
            // Move splitted pdf to finished folder
            moveToFolder(pdf, `${jobDir}/splitted`)
          }
          console.log(result)
          for (const splitPdf of result.success) {
            const splitPdfData = {
              pdf: path.basename(splitPdf.pdf),
              retries: 0
            }
            try { // Get pdf content
              const splitPdfContent = await pdfReader(splitPdf.pdf)
              splitPdfData.pdfText = splitPdfContent.textContent.map(ele => ele.str)
            } catch (error) {
              await handleError(splitPdfData, false, jobDir, 'Failed when reading pdf', error, false)
              continue
            }
            // Get data
            const jsonData = {
              pdf: splitPdfData.pdf,
              retries: 0
            }
            try {
              splitPdfData.documentData = await findDocumentData[options.findDataMethod](method, splitPdfData.pdfText)

              jsonData.documentData = { ...splitPdfData.documentData, split: true }

              moveToNextJob(jsonData, false, jobDir, 'createE18job')
            } catch (error) {
              await handleError(jsonData, false, jobDir, 'Failed when finding documentData', error, false)
              continue
            }
          }
        } else {
          // Get data
          const jsonData = {
            pdf: pdfData.pdf,
            retries: 0
          }
          try {
            pdfData.documentData = await findDocumentData[options.findDataMethod](method, pdfData.pdfText)
            jsonData.documentData = pdfData.documentData
            moveToNextJob(jsonData, false, jobDir, 'createE18job')
          } catch (error) {
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
