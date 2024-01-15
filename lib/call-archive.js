const { VFK_ARCHIVE, TFK_ARCHIVE } = require('../config')
const { getMsalToken } = require('./get-msal-token')
const axios = require('./axios-instance').getAxiosInstance()

module.exports.callArchive = async (countyNumber, endpoint, payload) => {
  if (!countyNumber) throw new Error('Missing required parameter "countyNumber"')
  if (!endpoint) throw new Error('Missing required parameter "endpoint"')
  if (!payload) throw new Error('Missing required parameter "payload"')

  if (countyNumber === '39') { // Vestfold
    const authConfig = {
      countyName: 'Vestfold',
      clientId: VFK_ARCHIVE.CLIENT_ID,
      tenantId: VFK_ARCHIVE.TENANT_ID,
      clientSecret: VFK_ARCHIVE.CLIENT_SECRET,
      scope: VFK_ARCHIVE.SCOPE
    }
    const accessToken = await getMsalToken(authConfig)
    const { data } = await axios.post(`${VFK_ARCHIVE.URL}/${endpoint}`, payload, { headers: { Authorization: `Bearer ${accessToken}` } })
    return data
  } else if (countyNumber === '40') { // Telemark
    const authConfig = {
      countyName: 'Telemark',
      clientId: TFK_ARCHIVE.CLIENT_ID,
      tenantId: TFK_ARCHIVE.TENANT_ID,
      clientSecret: TFK_ARCHIVE.CLIENT_SECRET,
      scope: TFK_ARCHIVE.SCOPE
    }
    const accessToken = await getMsalToken(authConfig)
    const { data } = await axios.post(`${TFK_ARCHIVE.URL}/${endpoint}`, payload, { headers: { Authorization: `Bearer ${accessToken}` } })
    return data
  } else {
    throw new Error('County number was not 39 or 40, do something about it...')
  }
}
