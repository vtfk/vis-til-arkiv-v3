// hent ut data, lagre json, send til neste jobb
const { archiveMethods } = require('../archiveMethods')
const pdfReader = require('@vtfk/pdf-text-reader')
const findDocumentData = require('../lib/findDocumentData')
const { getFilesInFolder, saveJsonDocument, moveToFolder } = require('../lib/fileAndfolderActions')
const splitPdf = require('@vtfk/pdf-splitter')
const path = require('path')
const { rootDirectory, documentDirectoryName } = require('../config')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}`
    const pdfs = getFilesInFolder(`${jobDir}`, 'pdf')
    for (const pdf of pdfs) { // For each pdf of the document type
      const pdfData = {
        pdfName: pdf
      }
      try { // Get pdf content
        const pdfContent = await pdfReader(pdf)
        pdfData.pdfText = pdfContent.textContent.map(ele => ele.str)
      } catch (error) {
        console.log(error)
      }
      try { // Get relevant data from the pdf
        pdfData.documentData = findDocumentData[options.findDataMethod](method, pdfData.pdfText)
        if (pdfData.documentData.split) {
          // split pdf
          // gjør en jobb per resulterende pdf med json - send disse til neste jobb
          // må gjøres til pdf/a i arkivet

          const pdfToSplit = {
            pdf,
            keywords: options.splitStrings
            // outputDir: `${jobDir}` // Optional, defaults to directory of the input pdf
          }
          let result

          try {
            result = await splitPdf(pdfToSplit)
          } catch (error) {
            console.log(error)
          }
          if (result.failed.length > 0) {
            // Move splitted pdf to failed folder
            moveToFolder(pdf, `${jobDir}/failedSplitted`) // Lagre json med info om hva som feila i splittinga
            console.log('AIAIAIAIAIA splitting faila', result.failed)
          } else {
            // Move splitted pdf to finished folder
            moveToFolder(pdf, `${jobDir}/splitted`)
          }
          for (const splitPdf of result.success) {
            const splitPdfData = {
              pdfName: splitPdf
            }
            try { // Get pdf content
              const splitPdfContent = await pdfReader(splitPdf.pdf)
              splitPdfData.pdfText = splitPdfContent.textContent.map(ele => ele.str)
            } catch (error) {
              console.log(error)
            }

            // Get data
            try {
              splitPdfData.documentData = await findDocumentData[options.findDataMethod](method, splitPdfData.pdfText)
              moveToFolder(splitPdf.pdf, `${jobDir}/syncStudentData`)
              const jsonFile = {
                pdf: path.basename(splitPdf.pdf),
                documentData: { ...splitPdfData.documentData, split: true },
                retries: 0
              }
              saveJsonDocument(`${jobDir}/syncStudentData/${path.basename(splitPdf.pdf).substring(0, path.basename(splitPdf.pdf).lastIndexOf('.'))}.json`, jsonFile)
            } catch (error) {
              console.log(error)
            }
          }
        } else {
          // Get data
          try {
            pdfData.documentData = await findDocumentData[options.findDataMethod](method, pdfData.pdfText)
            moveToFolder(pdf, `${jobDir}/syncStudentData`)
            const jsonFile = {
              pdf: path.basename(pdfData.pdfName),
              documentData: pdfData.documentData,
              retries: 0
            }
            saveJsonDocument(`${jobDir}/syncStudentData/${path.basename(pdfData.pdfName).substring(0, path.basename(pdfData.pdfName).lastIndexOf('.'))}.json`, jsonFile)
          } catch (error) {
            console.log(error)
          }
        }
      } catch (error) {
        console.log('Error finding documentData', error)
      }
    }
  }
}
