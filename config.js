require('dotenv').config()

module.exports = {
  unavailable: true, // if the service should send email to user that it is unavailable, instead of archiving
  useOcr: true, // if you should run ocr on documents that cannot be recognized (requires set up of ocr)
  ocrEngine: process.env.OCR_ENGINE || 'path to ocrMyPdf nodejs script',
  email: {
    fileNameEmailSeparator: process.env.FILE_NAME_EMAIL_SEPARATOR || '---',
    smtpHost: process.env.SMTP_HOST || 'smtp.mail.com',
    smtpPort: process.env.SMTP_PORT || '1'
  },
  teams: {
    url: process.env.TEAMSWEBHOOK_URL || 'teams.webhook.com'
  },
  rootDirectory: process.env.ROOT_DIRECTORY || 'C:/VisTilArkiv',
  dispatchDirectoryName: process.env.DISPATCH_DIRECTORY_NAME || 'input',
  ocrInputDirectory: process.env.OCR_INPUT_DIRECTORY_NAME || 'where ocr should take place',
  ocrDispatchDirectoryName: process.env.OCR_DISPATCH_DIRECTORY_NAME || 'ocrInput',
  documentDirectoryName: process.env.DOCUMENT_DIRECTORY_NAME || 'documents',
  deleteDirectoryName: process.env.DELETE_DIRECTORY_NAME || 'delete',
  originalsDirectoryName: process.env.ORIGINALS_DIRECTORY_NAME || 'originals',
  typeSearchWord: process.env.TYPE_SEARCH_WORD || 'VIS MAL TYPE',
  statFile: process.env.STAT_FILE || 'C:/VisTilArkiv/stat.json',
  deleteFinishedJobs: process.env.DELETE_FINISHED_JOBS || false,
  retryCount: 4, // don't set longer than retryTime.length
  retryTime: [5, 60, 240, 1440], // minutes
  p360: {
    syncElevmappeUrl: process.env.P360_SYNCELEVMAPPE_URL || 'syncelevmappe.<domain>.no/api/v1/SyncElevmappe',
    syncElevmappeKey: process.env.P360_SYNCELEVMAPPE_KEY || 'asfdfhdskjgfkjdfgjkfglkjhdflkgdf23',
    syncElevmappeHeaderName: process.env.P360_SYNCELEVMAPPE_HEADER_NAME || 'some-header-name',
    archiveDocUrl: process.env.P360_ARCHIVE_DOC_URL || 'https://360.<domain>.no/SIFapi',
    dispatchDocUrl: process.env.P360_DISPATCH_DOC_URL || 'https://360.<domain>.no/SIFapi',
    archiveKey: process.env.P360_ARCHIVE_KEY || 'asfdfhdskjgfkjdfgjkfglkjhdflkgdf23',
    archiveQueryString: process.env.P360_ARCHIVE_QUERY_STRING || '?mrQueryString='
  },
  e18: {
    url: process.env.E18_URL || 'e18.dumdumjson.no',
    key: process.env.E18_KEY || 'mkay',
    headerName: process.env.E18_HEADER_NAME || 'J.R.R'
  }
}
