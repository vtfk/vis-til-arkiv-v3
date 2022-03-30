const { ocrEngine, ocrInputDirectory, ocrDispatchDirectoryName, rootDirectory } = require('./config')
const ocr = require(ocrEngine)
const { getFilesInFolder, moveToFolder } = require('./lib/fileAndfolderActions')
const { logger } = require('@vtfk/logger')
const { teamsError } = require('./lib/teamsActions')
const fs = require('fs')
const path = require('path')

const runOcr = async () => {
  const pdfs = getFilesInFolder(ocrInputDirectory, 'pdf')
  if (!fs.existsSync(`${rootDirectory}/${ocrDispatchDirectoryName}`)) fs.mkdirSync(`${rootDirectory}/${ocrDispatchDirectoryName}`)
  logger('info', ['Vis-til-Arkiv', `Found ${pdfs.length} pdfs in VIStilArkiv OCR folder`])
  for (const pdf of pdfs) {
    logger('info', ['Vis-til-Arkiv', `Trying to run OCR on ${pdf}`])
    try {
      const ocrRes = ocr(pdf, `${rootDirectory}/${ocrDispatchDirectoryName}/${path.basename(pdf)}`)
      if (ocrRes.gsError) {
        moveToFolder(pdf, `${ocrInputDirectory}/error`)
        await teamsError('Ghostscript failed when running ocr', pdf, ocrRes.gsError)
        logger('error', ['Vis-til-Arkiv', `Ghostscript failed when running ocr on ${pdf}`, ocrRes.gsError])
        continue
      }
      if (ocrRes.ocrError) {
        moveToFolder(pdf, `${ocrInputDirectory}/error`)
        await teamsError('OcrMyPdf failed when running ocr', pdf, ocrRes.ocrError)
        logger('error', ['Vis-til-Arkiv', `OcrMyPdf failed when running ocr on ${pdf}`, ocrRes.ocrError])
        continue
      }
      fs.unlinkSync(pdf) // finished ocr, can delete the document
      logger('info', ['Vis-til-Arkiv', `Finished ocr on ${pdf} and saved result to ${rootDirectory}/${ocrDispatchDirectoryName}/${path.basename(pdf)}`, 'Great success!'])
    } catch (error) {
      moveToFolder(pdf, `${ocrInputDirectory}/error`)
      await teamsError('OCR failed due to unknown error', pdf, error.toString())
      logger('error', ['Vis-til-Arkiv', `OCR failed due to unknown error on ${pdf}`, error])
      continue
    }
  }
}

runOcr() // Do the thing
