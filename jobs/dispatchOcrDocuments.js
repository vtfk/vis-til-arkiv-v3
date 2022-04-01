const pdfReader = require('@vtfk/pdf-text-reader')
const { getFilesInFolder, moveToFolder, getEmailFromFileName, getFileName, getDocumentTypeDir, createSubFolder } = require('../lib/fileAndfolderActions')
const { teamsInfo } = require('../lib/teamsActions')
const { emailUnrecognizedDocument, emailServiceUnavailable } = require('../lib/sendEmail')
const { ocrDispatchDirectoryName, typeSearchWord, documentDirectoryName, deleteDirectoryName, rootDirectory, unavailable, originalsDirectoryName } = require('../config')
const { logger } = require('@vtfk/logger')
const { archiveMethods, visStandardDocs } = require('../archiveMethods')
const { jwIncludes, jwIncludesSentence, similar } = require('../lib/jaroWinkler')
const fs = require('fs')
const path = require('path')

const checkSoknad = (pdfStrings) => {
  const foundTypes = []
  for (let i = 0; i < pdfStrings.length; i++) { // Note that field description and value is found in the same element (str) in this documentType, where the description field and values are found is dependent on the structure of the pdf
    if (pdfStrings[i].split(':').length === 2) {
      const desc = pdfStrings[i].split(':')[0].trim()
      const value = pdfStrings[i].split(':')[1].trim().substring(0, 6) // Quick-fix, the value for this type always contains six characters
      if (desc === typeSearchWord || similar(desc, typeSearchWord)) {
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

    const hasIdentifierWords = idW.every((word) => pdfText.words.includes(word) || jwIncludes(word, pdfText.words))
    const hasIdentifierSentences = idS.every((s) => pdfText.sentence.includes(s) || jwIncludesSentence(s, pdfText.sentence))

    if (hasIdentifierWords && hasIdentifierSentences && !foundTypes.includes(docType.id)) foundTypes.push(docType.id)
  }
  return foundTypes
}

module.exports = async () => {
  createSubFolder(ocrDispatchDirectoryName)
  createSubFolder(documentDirectoryName)
  createSubFolder(deleteDirectoryName)

  const listOfPdfs = getFilesInFolder(`${rootDirectory}/${ocrDispatchDirectoryName}`, 'pdf')
  logger('info', ['Vis-til-Arkiv', `Found ${listOfPdfs.length} pdfs in VIStilArkiv OCR-dispatch folder`])
  for (const pdf of listOfPdfs) {
    logger('info', ['Vis-til-Arkiv', `Reading file ${pdf}`])
    const pdfContent = await pdfReader(pdf, { inferLines: { normalizeY: true } }) // read pdf
    let pdfStrings = Object.values(pdfContent.lines) // Fetch all the lines as string values
    pdfStrings = pdfStrings.map(str => str.replace(/[^a-zA-Z0-9ÆØÅæøå:., ]/g, '')) // Remove characters we do not need
    pdfStrings = pdfStrings.map(str => str.replace(/\s\s+/g, ' ').trim()) // Remove multiple whitespace possibly created by previous line
    let foundTypes = []

    foundTypes = foundTypes.concat(checkSoknad(pdfStrings))
    foundTypes = foundTypes.concat(checkIdentifierStrings(pdfStrings))

    if (foundTypes.length === 1 && !unavailable) {
      createSubFolder(getDocumentTypeDir(foundTypes[0], true))
      moveToFolder(pdf, `${getDocumentTypeDir(foundTypes[0])}/ocrGetData`)
      logger('info', ['Vis-til-Arkiv', `Found documenttype ${foundTypes[0]} and moved pdf ${pdf} to folder ${getDocumentTypeDir(foundTypes[0])}/ocrGetData`])
    } else {
      moveToFolder(pdf, `${rootDirectory}/${deleteDirectoryName}`)
      fs.renameSync(`${rootDirectory}/${originalsDirectoryName}/${path.basename(pdf)}`, `${rootDirectory}/${deleteDirectoryName}/${path.basename(pdf).substring(0, path.basename(pdf).lastIndexOf('.'))}-ORIGINAL.pdf`) // Holy shit

      const strippedPdfContent = pdfStrings.join(' ').replace(/[0-9]/g, '').substring(0, 50)

      const userEmailAddress = getEmailFromFileName(pdf)
      const filename = getFileName(pdf)

      if (unavailable) {
        emailServiceUnavailable(userEmailAddress, filename)
      } else {
        emailUnrecognizedDocument(userEmailAddress, filename)
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
