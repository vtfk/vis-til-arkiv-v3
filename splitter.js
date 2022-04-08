(async () => {
  const ocrSplitter = require('./jobs/ocrSplitDocuments')
  const splitter = require('./jobs/splitDocuments')
  const { logger } = require('@vtfk/logger')
  const { teamsError } = require('./lib/teamsActions')
  const { rootDirectory } = require('./config')

  try {
    await ocrSplitter()
  } catch (error) {
    logger('error', ['Vis-til-Arkiv', 'Failed when splitting ocr pdfs', error.toString()])
    await teamsError('Failed when splitting ocr pdfs', rootDirectory, error)
  }
  try {
    await splitter()
  } catch (error) {
    logger('error', ['Vis-til-Arkiv', 'Failed when splitting pdfs', error.toString()])
    await teamsError('Failed when splitting pdfs', rootDirectory, error)
  }
})()
