// hent ut data, lagre json, send til neste jobb
const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder } = require('../lib/fileAndfolderActions')
const { moveToNextJob, handleError, shouldRun } = require('../lib/jobTools')
const { rootDirectory, documentDirectoryName, p360 } = require('../config')
const { logger } = require('@vtfk/logger')
const axios = require('axios')
const { similar } = require('../lib/jaroWinkler')
const { teamsWarn } = require('../lib/teamsActions')
const { callArchive } = require('../lib/call-archive')

const verifyStudentData = async (input, output, pdf, svarUt) => {
  const checks = {
    firstNames: (input.firstName === output.firstName),
    lastNames: (input.lastName === output.lastName),
    similarity: similar(`${input.firstName} ${input.lastName}`, `${output.firstName} ${output.lastName}`, 0.93)
  }
  if (checks.firstNames && checks.lastNames) {
    logger('info', ['Vis-til-Arkiv', 'Successfully verified firstname and lastname through DSF'])
    return
  }
  if (checks.similarity) { // Add "&& !svarUt" for stricter similarity check on stuff that is using Svarut
    logger('info', ['Vis-til-Arkiv', `Successfully verified firstname and lastname through a similarity check - ${input.firstName} ${input.lastName} above 93% similar to ${output.firstName} ${output.lastName}`])
    // await teamsWarn('Verified name through similarity - check names, and if something is fishy, fix it ASAP!', pdf, `PDF name: "${input.firstName} ${input.lastName}", DSF name: "${output.firstName} ${output.lastName}"`)
    return
  }
  throw new Error('Names do not match - please check manually')
}

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}/syncStudentData`

    const jsons = getFilesInFolder(jobDir, 'json')
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object
      if (!shouldRun(json.nextTry)) continue
      try {
        if (!json.documentData) throw new Error(`${jsonFile} is missing required property "documentData", something is not right`)
        if (!json.documentData.ssn && !(json.documentData.birthdate && json.documentData.firstName && json.documentData.lastName)) throw new Error(`${jsonFile} is missing required property "documentData.ssn" or ("documentData.birthdate" and "documentData.firstName" and "documentData.lastName"), something is not right`)
        const studentIdentifer = json.documentData.ssn ? { ssn: json.documentData.ssn } : { birthdate: json.documentData.birthdate, firstName: json.documentData.firstName, lastName: json.documentData.lastName }
        const syncElevmappeRes = callArchive(json.documentData.schoolCountyNumber, 'SyncElevmappe', studentIdentifer)
        if (json.documentData.ocr) {
          await verifyStudentData({ firstName: json.documentData.firstName, lastName: json.documentData.lastName }, { firstName: syncElevmappeRes.privatePerson.firstName, lastName: syncElevmappeRes.privatePerson.lastName }, jsonFile, archiveMethods[method].svarUt)
        }
        moveToNextJob({ ...json, ...syncElevmappeRes }, jsonFile, jobDir, 'getArchiveMetadata')
      } catch (error) {
        await handleError(json, jsonFile, jobDir, 'Failed when synchronizing elevmappe', error, true)
      }
    }
  }
}
