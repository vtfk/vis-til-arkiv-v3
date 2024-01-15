const pdfReader = require('@vtfk/pdf-text-reader')
const { getFilesInFolder, moveToFolder, getEmailFromFileName, getFileName, getDocumentTypeDir, createSubFolder, copyFile } = require('../lib/fileAndfolderActions')
const { teamsInfo } = require('../lib/teamsActions')
const { emailUnrecognizedDocument, emailServiceUnavailable } = require('../lib/sendEmail')
const { dispatchDirectoryName, typeSearchWord, documentDirectoryName, deleteDirectoryName, rootDirectory, unavailable, useOcr, ocrInputDirectory, originalsDirectoryName } = require('../config')
const { logger } = require('@vtfk/logger')
const { archiveMethods, visStandardDocs } = require('../archiveMethods')

const checkSoknad = (pdfStrings) => {
  const foundTypes = []
  for (let i = 0; i < pdfStrings.length; i++) { // Note that field description and value is found in the same element (str) in this documentType, where the description field and values are found is dependent on the structure of the pdf
    if (pdfStrings[i].split(':').length === 2) {
      const desc = pdfStrings[i].split(':')[0].trim()
      const value = pdfStrings[i].split(':')[1].trim()
      if (desc === typeSearchWord) {
        if (archiveMethods[value] && !foundTypes.includes(value) && archiveMethods[value].findDataMethod && archiveMethods[value].findDataMethod === 'soknad' && archiveMethods[value].active) foundTypes.push(value)
      }
    }
  }
  return foundTypes
}

const checkIdentifierStrings = (pdfStrings) => {
  const pdfText = {
    words: []
  }
  for (const str of pdfStrings) {
    pdfText.words.push(...str.split(' ').filter(word => /\S/.test(word))) // Saves all words from the pdf into array
  }
  pdfText.sentence = pdfText.words.join(' ') // Creates a string from all the words put together

  const foundTypes = []
  for (const docType of (visStandardDocs.filter(m => m.active))) {
    let idW = docType.identifierStrings.filter(w => w.trim().split(' ').length === 1)
    let idS = docType.identifierStrings.filter(w => !idW.includes(w))
    idW = idW.map(w => w.trim())
    idS = idS.map(s => s.trim())

    const hasIdentifierWords = idW.every((word) => pdfText.words.includes(word))
    const hasIdentifierSentences = idS.every((sentence) => pdfText.sentence.includes(sentence))

    if (hasIdentifierWords && hasIdentifierSentences && !foundTypes.includes(docType.id)) foundTypes.push(docType.id)
  }
  return foundTypes
}

module.exports = async () => {
  createSubFolder(dispatchDirectoryName)
  createSubFolder(documentDirectoryName)
  createSubFolder(deleteDirectoryName)
  createSubFolder(originalsDirectoryName)

  const listOfPdfs = getFilesInFolder(`${rootDirectory}/${dispatchDirectoryName}`, 'pdf')
  logger('info', ['Vis-til-Arkiv', `Found ${listOfPdfs.length} pdfs in VIStilArkiv dispatch folder`])
  for (const pdf of listOfPdfs) {
    logger('info', ['Vis-til-Arkiv', `Reading file ${pdf}`])
    const pdfContent = await pdfReader(pdf) // read pdf
    const pdfStrings = pdfContent.textContent.map(ele => ele.str)
    let foundTypes = []

    foundTypes = foundTypes.concat(checkSoknad(pdfStrings))
    foundTypes = foundTypes.concat(checkIdentifierStrings(pdfStrings))

    if (foundTypes.length === 1 && !unavailable) {
      createSubFolder(getDocumentTypeDir(foundTypes[0], true))
      moveToFolder(pdf, `${getDocumentTypeDir(foundTypes[0])}/getData`)
      logger('info', ['Vis-til-Arkiv', `Found documenttype ${foundTypes[0]} and moved pdf ${pdf} to folder ${getDocumentTypeDir(foundTypes[0])}/getData`])
    } else {
      const strippedPdfContent = pdfStrings.join(' ').replace(/[0-9]/g, '').substring(0, 50)
      if (useOcr && !unavailable) {
        copyFile(pdf, `${rootDirectory}/${originalsDirectoryName}`)
        moveToFolder(pdf, ocrInputDirectory)
        logger('info', ['Vis-til-Arkiv', `Could not find any documenttype for pdf ${pdf}, moved to folder ${ocrInputDirectory} and will try to run OCR on the document to see if that helps`])
        // await teamsInfo(`Could not find any documenttype for pdf ${pdf}, moved to folder ${ocrInputDirectory} and will try to run OCR on the document to see if that helps`, pdf, `PDF content (stripped for numbers, and length 50): ${strippedPdfContent}`)
      } else {
        moveToFolder(pdf, `${rootDirectory}/${deleteDirectoryName}`)

        const userEmailAddress = getEmailFromFileName(pdf)
        const filename = getFileName(pdf)

        if (unavailable) {
          try {
            await emailServiceUnavailable(userEmailAddress, filename)
          } catch (error) {
            await teamsInfo(`Could not send email to ${userEmailAddress}`, pdf, error.response?.data || error.stack || error.toString())
          }
        } else {
          try {
            await emailUnrecognizedDocument(userEmailAddress, filename)
          } catch (error) {
            await teamsInfo(`Could not send email to ${userEmailAddress}`, pdf, error.response?.data || error.stack || error.toString())
          }
        }

        if (foundTypes.length === 0) {
          logger('info', ['Vis-til-Arkiv', `Could not find any documenttype for pdf ${pdf}, moved to folder ${rootDirectory}/${deleteDirectoryName} and sent email to ${userEmailAddress}`])
          await teamsInfo(`Could not find documenttype, sent email to ${userEmailAddress}`, pdf, `PDF content (stripped for numbers, and length 50): ${strippedPdfContent}`)
        } else {
          logger('warn', ['Vis-til-Arkiv', `Found several documenttypes for pdf ${pdf}, moved to folder ${rootDirectory}/${deleteDirectoryName} and sent email to ${userEmailAddress}`])
          await teamsInfo(`Found SEVERAL documenttypes, sent email to ${userEmailAddress}`, pdf, `PDF content (stripped for numbers, and length 50): ${strippedPdfContent}`)
        }
      }
    }
  }
}
