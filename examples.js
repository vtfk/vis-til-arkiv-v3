(async () => {
  const axios = require('axios')
  const dispatchDocuments = require('./jobs/dispatchDocuments')
  const getData = require('./jobs/getData')
  const syncStudentData = require('./jobs/syncStudentData')
  const getArchiveMetadata = require('./jobs/getArchiveMetadata')
  const archiveDocument = require('./jobs/archiveDocument')
  const svarut = require('./jobs/svarut')
  const findDocumentData = require('./lib/findDocumentData')
  const { archiveMethods } = require('./archiveMethods')
  const { rootDirectory, documentDirectoryName, p360 } = require('./config')
  const { getPdfsInFolder, convertToBase64, saveJsonDocument } = require('./lib/fileAndfolderActions')
  const pdfReader = require('@vtfk/pdf-text-reader')
  const { teamsError } = require('./lib/teamsActions')
  const createMetadata = require('./lib/createMetadata')

  try {
    await dispatchDocuments()
  } catch (error) {
    console.log(error)
    // await teamsError('Error when dispatching documents', rootDirectory, error)
  }
  try {
    await getData()
  } catch (error) {
    console.log(error)
    // await teamsError('Error when dispatching documents', rootDirectory, error)
  }
  try {
    await syncStudentData()
  } catch (error) {
    console.log(error)
    // await teamsError('Error when dispatching documents', rootDirectory, error)
  }
  try {
    getArchiveMetadata()
  } catch (error) {
    console.log(error)
    // await teamsError('Error when dispatching documents', rootDirectory, error)
  }
  try {
    await archiveDocument()
  } catch (error) {
    console.log(error)
    // await teamsError('Error when dispatching documents', rootDirectory, error)
  }
  try {
    await svarut()
  } catch (error) {
    console.log(error)
  }

  // get document data, create json, move to next job folder

  // sync contact, write json, move to next job folder

  // create archive metadata, write json, move to next job folder

  // send to archive, if dispatch, write json, move to svarut folder, else move to imported

  // if blocked address, create internal note, else - dispatch documents, move to imported
  /*
  for (const [method, options] of Object.entries(archiveMethods)) { // For each document type
    const pdfs = getPdfsInFolder(`${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}`)
    for (const pdf of pdfs) { // For each pdf of the document type
      const jsonFile = {}
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
        pdfData.data = findDocumentData[options.findDataMethod](method, pdfData.pdfText)
      } catch (error) {
        console.log('Error finding documentData', error)
      }
      // Get person info from DSF and P360
      try {
        const syncElevmappe = await axios.post(p360.syncElevmappeUrl, { ssn: '29019342709' }, { headers: { [p360.syncElevmappeHeaderName]: p360.syncElevmappeKey } })
        pdfData.studentData = syncElevmappe.data
      } catch (error) {
        console.log(error)
      }
      try {
        pdfData.documentData = {
          studentName: `${pdfData.studentData.dsfPerson.firstName} ${pdfData.studentData.dsfPerson.lastName}`,
          studentBirthnr: pdfData.studentData.dsfPerson.ssn,
          elevmappeCaseNumber: pdfData.studentData.elevmappe.CaseNumber,
          pdfFileBase64: convertToBase64(pdf),
          ...pdfData.data
        }
        pdfData.p360metadata = createMetadata({ template: require(`../templates/${options.archiveTemplate}.json`), documentData: pdf.documentData })
      } catch (error) {

      }
      try {
        console.log(pdfData.pdfName)
        jsonFile.name = saveJsonDocument(pdfData.pdfName.substr(0, pdfData.pdfName.lastIndexOf('.')) + '.json', pdfData)
      } catch (error) {
        console.log(error)
      }
    }
  } */
})()
