(async () => {
  const dispatchDocuments = require('./jobs/dispatchDocuments')
  const getData = require('./jobs/getData')
  const syncStudentData = require('./jobs/syncStudentData')
  const getArchiveMetadata = require('./jobs/getArchiveMetadata')
  const archiveDocument = require('./jobs/archiveDocument')
  const svarut = require('./jobs/svarut')
  const statsAndCleanup = require('./jobs/statsAndCleanup')
  const { rootDirectory } = require('./config')
  const { logger } = require('@vtfk/logger')
  const { teamsError } = require('./lib/teamsActions')

  try {
    await dispatchDocuments()
  } catch (error) {
    logger('error', ['Vis-til-Arkiv', 'Failed when dispatching documents to type-folders', error.toString()])
    await teamsError('Failed when dispatching documents to type folders', rootDirectory, error)
  }
  try {
    await getData()
  } catch (error) {
    logger('error', ['Vis-til-Arkiv', 'Failed when getting document data from pdfs', error.toString()])
    await teamsError('Failed when getting document data from pdfs', rootDirectory, error)
  }
  try {
    await syncStudentData()
  } catch (error) {
    logger('error', ['Vis-til-Arkiv', 'Failed when getting student data', error.toString()])
    await teamsError('Failed when getting student data', rootDirectory, error)
  }
  try {
    await getArchiveMetadata()
  } catch (error) {
    logger('error', ['Vis-til-Arkiv', 'Failed when getting archive metadata', error.toString()])
    await teamsError('Failed when getting archive metadata', rootDirectory, error)
  }
  try {
    await archiveDocument()
  } catch (error) {
    logger('error', ['Vis-til-Arkiv', 'Failed when archiving documents', error.toString()])
    await teamsError('Failed when archiving documents', rootDirectory, error)
  }
  try {
    await svarut()
  } catch (error) {
    logger('error', ['Vis-til-Arkiv', 'Failed when sending on svarut/creating internal note', error.toString()])
    await teamsError('Failed when sending on svarut/creating internal note', rootDirectory, error)
  }
  try {
    await statsAndCleanup()
  } catch (error) {
    logger('error', ['Vis-til-Arkiv', 'Failed when creating stats and cleanup', error.toString()])
    await teamsError('Failed when creating stats and cleanup', rootDirectory, error)
  }
})()
