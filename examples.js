(async () => {
  const dispatchDocuments = require('./jobs/dispatchDocuments')
  const getData = require('./jobs/getData')
  const syncStudentData = require('./jobs/syncStudentData')
  const getArchiveMetadata = require('./jobs/getArchiveMetadata')
  const archiveDocument = require('./jobs/archiveDocument')
  const svarut = require('./jobs/svarut')
  const statsAndCleanup = require('./jobs/statsAndCleanup')

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
    await getArchiveMetadata()
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
  try {
    await statsAndCleanup()
  } catch (error) {
    console.log(error)
  }
  // get document data, create json, move to next job folder

  // sync contact, write json, move to next job folder

  // create archive metadata, write json, move to next job folder

  // send to archive, if dispatch, write json, move to svarut folder, else move to imported

  // if blocked address, create internal note, else - dispatch documents, move to imported
})()
