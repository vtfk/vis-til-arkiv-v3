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
  statFile: process.env.STAT_FILE || 'C:/VisTilArkiv/stat.json',
  deleteFinishedJobs: process.env.DELETE_FINISHED_JOBS || false,
  retryCount: 3, // don't set longer than retryTime.length
  retryTime: [5, 60, 240], // minutes
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
