const axios = require('axios')
const { teams } = require('../config')
require('dotenv').config()

module.exports = {
  teamsInfo: async (msg, filename, info) => {
    if (!process.env.TEAMSWEBHOOK_URL) {
      console.log('Teams webhook is not defined in env, will not post msg to teams')
      return
    }
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
  teamsWarn: async (msg, filename, warn) => {
    if (!process.env.TEAMSWEBHOOK_URL) {
      console.log('Teams webhook is not defined in env, will not post msg to teams')
      return
    }
    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: 'Vis til arkiv Info',
      themeColor: 'e88b2e',
      title: 'VIS til arkiv - Warning',
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
              name: 'Warning',
              value: warn
            }
          ]
        }
      ]
    }
    await axios.post(teams.url, payload)
  },
  teamsError: async (msg, filename, error) => {
    if (!process.env.TEAMSWEBHOOK_URL) {
      console.log('Teams webhook is not defined in env, will not post msg to teams')
      return
    }
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
              value: JSON.stringify(error, null, 2)
            }
          ]
        }
      ]
    }
    await axios.post(teams.url, payload)
  }
}
