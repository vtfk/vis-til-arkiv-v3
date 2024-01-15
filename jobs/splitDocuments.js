// hent ut data, lagre json, send til neste jobb
const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder, moveToFolder, saveJsonDocument } = require('../lib/fileAndfolderActions')
const { handleError } = require('../lib/jobTools')
const { teamsError } = require('../lib/teamsActions')
const { logger } = require('@vtfk/logger')
const splitPdf = require('@vtfk/pdf-splitter')
const path = require('path')
const fs = require('fs')
const { rootDirectory, documentDirectoryName } = require('../config')

module.exports = async () => {
  const startTime = new Date()
  logger('info', ['Vis-til-Arkiv', 'Starting job splitDocuments'])
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/splitDocuments`
    const pdfs = getFilesInFolder(jobDir, 'pdf')
    if (pdfs.length > 0) logger('info', ['Vis-til-Arkiv', `Found ${pdfs.length} of type ${options.name} ready for splitting. Starting split process for each`])
    for (const pdf of pdfs) { // For each pdf of the document type
      const pdfData = {
        pdf: path.basename(pdf),
        retries: 0,
        pages: []
      }
      if (pdfData.pdf.charAt(pdfData.pdf.lastIndexOf('.') - 1) !== 'M') {
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
      try {
        logger('info', ['Vis-til-Arkiv', `Will try to split ${pdf}`])
        const result = await splitPdf(pdfToSplit)
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
      // Everything went well, move files and delete temp directory
      moveToFolder(pdf, `${jobDir}/splitted`)
      const splittedPdfs = getFilesInFolder(`${jobDir}/${pdfName}`, 'pdf')
      logger('info', ['Vis-til-Arkiv', `Moving ${splittedPdfs.length} of type ${options.name} to next job.`])
      for (const sp of splittedPdfs) {
        moveToFolder(sp, `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/getData`)
      }
      fs.rmdirSync(`${jobDir}/${pdfName}`)
      const endTime = new Date()
      const duration = (endTime - startTime) / 1000 / 60
      if (duration > 240) {
        logger('warn', ['Vis-til-Arkiv', 'Splitter has been running for too long - ending task'])
        break
      } else {
        logger('info', ['Vis-til-Arkiv', 'Splitter is still going strong, will keep splitting'])
      }
    }
  }
}
