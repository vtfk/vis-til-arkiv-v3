// hent ut data, lagre json, send til neste jobb
const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder, moveToFolder, saveJsonDocument } = require('../lib/fileAndfolderActions')
const { handleError } = require('../lib/jobTools')
const { teamsError } = require('../lib/teamsActions')
const { logger } = require('@vtfk/logger')
const splitPdf = require('@vtfk/pdf-splitter')
const path = require('path')
const fs = require('fs')
const { rootDirectory, documentDirectoryName, originalsDirectoryName } = require('../config')

module.exports = async () => {
  logger('info', ['Vis-til-Arkiv', 'Starting job ocrSplitDocuments'])
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/ocrSplitDocuments`
    const pdfs = getFilesInFolder(jobDir, 'pdf')
    if (pdfs.length > 0) logger('info', ['Vis-til-Arkiv', `Found ${pdfs.length} of type ${options.name} ready for splitting. Starting split process for each`])
    for (const pdf of pdfs) { // For each pdf of the document type
      const pdfData = {
        pdf: path.basename(pdf),
        retries: 0,
        pages: []
      }
      if (pdfData.pdf.charAt(pdfData.pdf.lastIndexOf('.') -1) !== 'M') {
        moveToFolder(pdf, `${jobDir}/failedSplitted`)
        logger('error', ['Vis-til-Arkiv', `${pdf} is stuck in a split-loop! Check "${jobDir}/failedSplitted" for more info`])
        await teamsError(`${pdf} is stuck in a split-loop! Check "${jobDir}/failedSplitted" for more info`, pdf, 'WHHHOOOOps')
        continue
      }
      const pdfName = pdfData.pdf.substring(0, pdfData.pdf.lastIndexOf('.'))
      if (!fs.existsSync(`${jobDir}/${pdfName}`)) fs.mkdirSync(`${jobDir}/${pdfName}`)
      const pdfToSplit = {
        pdf,
        keywords: options.splitStrings,
        outputDir: `${jobDir}/${pdfName}` // Optional, defaults to directory of the input pdf
      }
      let splitRanges
      try {
        logger('info', ['Vis-til-Arkiv', `Will try to split ${pdf}`])
        result = await splitPdf(pdfToSplit)
        splitRanges = result.ranges
        if (result.failed.length > 0) {
          // Move splitted pdf to failed folder
          logger('error', ['Vis-til-Arkiv', `Could not split ${pdf} correctly, check "${jobDir}/failedSplitted" for more info`])
          await teamsError(`Could not split ${pdf} correctly, check "${jobDir}/failedSplitted" for more info`, pdf, 'WHHHOOOOps')
          moveToFolder(pdf, `${jobDir}/failedSplitted`)
          saveJsonDocument(`${jobDir}/failedSplitted/${path.basename(pdf).substring(0, path.basename(pdf).lastIndexOf('.'))}.json`, { pdf, result }) // Lagre json med info om hva som feila i splittinga
          continue
        }
      } catch (error) {
        await handleError(pdfData, false, jobDir, 'Failed when splitting pdf', error, false)
        continue
      }
      // Split originals as well
      try {
        logger('info', ['Vis-til-Arkiv', `OCR-split - will split original as well, at the same pages, ${pdf}`])
        splitOriginal = await splitPdf({ pdf: `${rootDirectory}/${originalsDirectoryName}/${path.basename(pdfToSplit.pdf)}`, ranges: splitRanges })
        if (splitOriginal.failed.length > 0) {
          // Move splitted pdf to failed folder
          logger('error', ['Vis-til-Arkiv', `Could not split original ${rootDirectory}/${originalsDirectoryName}/${path.basename(pdfToSplit.pdf)} correctly, check "${rootDirectory}/${originalsDirectoryName}/failedSplitted" for more info`])
          await teamsError(`Could not split original ${rootDirectory}/${originalsDirectoryName}/${path.basename(pdfToSplit.pdf)} correctly, check "${rootDirectory}/${originalsDirectoryName}/failedSplitted" for more info`, `${rootDirectory}/${originalsDirectoryName}/failedSplitted`, 'WHHHOOOOps')
          moveToFolder(`${rootDirectory}/${originalsDirectoryName}/${path.basename(pdfToSplit.pdf)}`, `${rootDirectory}/${originalsDirectoryName}/failedSplitted`)
          saveJsonDocument(`${rootDirectory}/${originalsDirectoryName}/failedSplitted/${path.basename(pdf).substring(0, path.basename(pdf).lastIndexOf('.'))}.json`, { pdf: `${rootDirectory}/${originalsDirectoryName}/${path.basename(pdfToSplit.pdf)}`, splitOriginal }) // Lagre json med info om hva som feila i splittinga
          continue
        } else {
          // Move splitted pdf to finished folder
          moveToFolder(`${rootDirectory}/${originalsDirectoryName}/${path.basename(pdfToSplit.pdf)}`, `${rootDirectory}/${originalsDirectoryName}/splitted`)
        }
      } catch (error) {
        moveToFolder(pdf, `${jobDir}/failedSplitted`)
        logger('error', ['Vis-til-Arkiv', `Could not split original ${rootDirectory}/${originalsDirectoryName}/${path.basename(pdfToSplit.pdf)} correctly`, error.toString()])
        await teamsError(`Could not split original ${rootDirectory}/${originalsDirectoryName}/${path.basename(pdfToSplit.pdf)} correctly`, `${rootDirectory}/${originalsDirectoryName}/failedSplitted`, error)
        continue
      }
      // Everything went well, move files and delete temp directory
      moveToFolder(pdf, `${jobDir}/splitted`)
      const splittedPdfs = getFilesInFolder(`${jobDir}/${pdfName}`, 'pdf')
      logger('info', ['Vis-til-Arkiv', `Moving ${splittedPdfs.length} of type ${options.name} to next job.`])
      for (const sp of splittedPdfs) {
        moveToFolder(sp, `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/ocrGetData`)
      }
      fs.rmdirSync(`${jobDir}/${pdfName}`)
    }
  }
}
