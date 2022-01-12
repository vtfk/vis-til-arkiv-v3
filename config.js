require('dotenv').config()

module.exports = {
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
  documentDirectoryName: process.env.DOCUMENT_DIRECTORY_NAME || 'documents',
  deleteDirectoryName: process.env.DELETE_DIRECTORY_NAME || 'delete',
  typeSearchWord: process.env.TYPE_SEARCH_WORD || 'VIS MAL TYPE',
  p360: {
    syncElevmappeUrl: process.env.P360_SYNCELEVMAPPE_URL || 'syncelevmappe.<domain>.no/api/v1/SyncElevmappe',
    syncElevmappeKey: process.env.P360_SYNCELEVMAPPE_KEY || 'asfdfhdskjgfkjdfgjkfglkjhdflkgdf23',
    syncElevmappeHeaderName: process.env.P360_SYNCELEVMAPPE_HEADER_NAME || 'some-header-name',
    archiveDocUrl: process.env.P360_ARCHIVE_DOC_URL || 'https://360.<domain>.no/api',
    archiveKey: process.env.P360_ARCHIVE_KEY || 'asfdfhdskjgfkjdfgjkfglkjhdflkgdf23'
  }
}
