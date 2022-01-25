// arkiver, lagre json, send til neste jobb, eller ferdig
const { archiveMethods } = require('../archiveMethods')
const { getFilesInFolder, saveJsonDocument, moveToFolder } = require('../lib/fileAndfolderActions')
const path = require('path')
const { rootDirectory, documentDirectoryName, p360 } = require('../config')
const axios = require('axios')

module.exports = async () => {
  for (const [method, options] of (Object.entries(archiveMethods).filter(m => m[1].active))) { // For each document type
    const jobDir = `${rootDirectory}/${documentDirectoryName}/${method}-${options.archiveTemplate}`

    const jsons = getFilesInFolder(`${jobDir}/archive`, 'json')
    for (const jsonFile of jsons) { // For each json of the document type
      const json = require(jsonFile) // Get json as object

      if (!json.metadata) throw new Error(`${jsonFile} is missing required property "metadata", something is not right`)

      try {
        const archiveRes = await axios.post(`${p360.archiveDocUrl}${p360.archiveQueryString}${p360.archiveKey}`, { parameter: json.metadata })

        if (!archiveRes.data.Successful) {
          throw new Error(archiveRes.data.ErrorMessage)
        }

        let dest = `${jobDir}/imported`
        if (options.svarUt) { // If document is to be sent as well as archived
          dest = `${jobDir}/svarut`
        }

        moveToFolder(`${jobDir}/archive/${json.pdf}`, dest)
        moveToFolder(jsonFile, dest)
        const jsonWrite = {
          ...json,
          archive: archiveRes.data
        }
        saveJsonDocument(`${dest}/${path.basename(jsonFile).substring(0, path.basename(jsonFile).lastIndexOf('.'))}.json`, jsonWrite)
      } catch (error) {
        console.log(error)
        // Continue and set retry count
      }
    }
  }
}
