require('dotenv').config()

module.exports = {
  unavailable: true, // if the service should send email to user that it is unavailable, instead of archiving
  useOcr: true, // if you should run ocr on documents that cannot be recognized (requires set up of ocr)
  ocrEngine: process.env.OCR_ENGINE || 'path to ocrMyPdf nodejs script',
  email: {
    fileNameEmailSeparator: process.env.FILE_NAME_EMAIL_SEPARATOR || '---',
    smtpHost: process.env.SMTP_HOST || 'smtp.mail.com',
    smtpPort: process.env.SMTP_PORT || '1',
    url: process.env.EMAIL_URL,
    secret: process.env.EMAIL_SECRET
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
  VFK_ARCHIVE: {
    URL: process.env.VFK_ARCHIVE_URL,
    CLIENT_ID: process.env.VFK_ARCHIVE_CLIENT_ID,
    CLIENT_SECRET: process.env.VFK_ARCHIVE_CLIENT_SECRET,
    TENANT_ID: process.env.VFK_ARCHIVE_TENANT_ID,
    SCOPE: process.env.VFK_ARCHIVE_SCOPE
  },
  TFK_ARCHIVE: {
    URL: process.env.TFK_ARCHIVE_URL,
    CLIENT_ID: process.env.TFK_ARCHIVE_CLIENT_ID,
    CLIENT_SECRET: process.env.TFK_ARCHIVE_CLIENT_SECRET,
    TENANT_ID: process.env.TFK_ARCHIVE_TENANT_ID,
    SCOPE: process.env.TFK_ARCHIVE_SCOPE
  },
}
