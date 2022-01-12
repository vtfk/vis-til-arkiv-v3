const axios = require('axios')
const { teams } = require('../config')

module.exports = {
  teamsInfo: async (msg, filename, info) => {
    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: 'Vis til arkiv Info',
      themeColor: 'f5d142',
      title: 'VIS til arkiv - Info',
      sections: [
        {
          facts: [
            {
              name: 'Message:',
              value: msg
            },
            {
              name: 'Filename',
              value: filename
            },
            {
              name: 'Info',
              value: info
            }
          ]
        }
      ]
    }
    await axios.post(teams.url, payload)
  },
  teamsError: async (msg, filename, error) => {
    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: 'Vis til arkiv error',
      themeColor: 'ff0033',
      title: 'VIS til arkiv - error',
      sections: [
        {
          facts: [
            {
              name: 'Message:',
              value: msg
            },
            {
              name: 'Filename',
              value: filename
            },
            {
              name: 'Error',
              value: error.toString()
            }
          ]
        }
      ]
    }
    await axios.post(teams.url, payload)
  }
}
