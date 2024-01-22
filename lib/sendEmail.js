const nodemailer = require('nodemailer')
const { email } = require('../config')
const { archiveMethods } = require('../archiveMethods')
const { logger } = require('@vtfk/logger')
const axios = require('axios').default

require('dotenv').config()

const sendEmailOld = (mail) => {
  if (process.env.NODE_ENV.toLowerCase() !== 'production') {
    console.log(`Node env is not production, will not send e-mail to ${mail.to}`)
    return
  }
  const transporter = nodemailer.createTransport({
    host: email.smtpHost,
    port: email.smtpPort
  })
  transporter.sendMail(mail, function (error) {
    if (error) throw new Error(error)
  })
}

const sendEmail = async (mail) => {
  const { to, subject, html, from, cc, bcc } = mail
  const payload = {
    to: [to],
    from,
    subject,
    html
  }
  if (cc) payload.cc = cc // don't add them to payload if not necessary (mail-api throws error when empty list)
  if (bcc) payload.bcc = bcc
  const headers = { 'x-functions-key': email.secret }
  const { data } = await axios.post(`${email.url}`, payload, { headers })
  logger('info', ['send-mail', 'mail sent', 'to', payload.to])
  return data
}

module.exports = {
  emailUnrecognizedDocument: async (emailAddress, filename) => {
    // VIRKER SOM OM EPOST MÅ SKRIVES OM TIL VTFK for å funke med lokal smpt - kan evt bare bruke mail-api da.. Yup bruker bare mail-api :P
    const activeMethods = []
    for (const val of Object.values(archiveMethods)) {
      if (val.active) activeMethods.push(val.name)
    }
    let mailStr = '<em>(Dette er en automatisk generert e-post, du kan ikke svare på denne)</em> <br><br> Hei! <br><br> Arkiveringsløsningen VIS til Arkiv (Public 360) kunne ikke håndtere ditt dokument: <em>' + filename + '</em> siden løsningen ikke kunne gjenkjenne dokumenttypen. Ditt dokument vil <strong>ikke</strong> bli behandlet, og slettes automatisk. <br><br>' +
    'Godkjente svarbrev du kan sende til printeren fra VIS er som følger: <br><ul>'
    for (const method of activeMethods) {
      mailStr += `<li>${method}</li>`
    }
    mailStr += '</ul><br><br>--<br> Mvh Seksjon for arkiv og dokumenthåndtering'
    const mailOptions = {
      from: 'ikkeSvar@vtfk.no',
      to: emailAddress,
      subject: 'VIS til Arkiv - ditt dokument ' + filename + ' ble ikke gjenkjent som et gyldig svarbrev fra VIS og vil bli slettet',
      html: mailStr
    }

    await sendEmail(mailOptions)
  },
  emailPrinterDisabled: async (emailAddress, filename) => {
    const htmlText = '<em>(Dette er en automatisk generert e-post, du kan ikke svare på denne)</em> <br><br> Hei! <br><br> Arkiveringsløsningen VIS til Arkiv (Public 360), er ikke skrudd på da den fortsatt er under testing. Ditt dokument, <em>' + filename + '</em>, vil <strong>ikke</strong> bli behandlet - du kan begynne å bruke løsningen fra og med 1. september. <br><br>---<br> Mvh BDK-TEK'
    const mailOptions = {
      from: 'ikkeSvar@vtfk.no',
      to: emailAddress,
      subject: 'VIS til Arkiv - løsningen er ikke aktiv enda, dokumentet du har sendt til printeren vil ikke bli behandlet',
      html: htmlText
    }

    await sendEmail(mailOptions)
  },
  emailServiceUnavailable: async (emailAddress, filename) => {
    const htmlText = '<em>(Dette er en automatisk generert e-post, du kan ikke svare på denne)</em> <br><br> Hei! <br><br> Arkiveringsløsningen VIS til Arkiv (Public 360), er skrudd av grunnet delingen av fylket. Dokumenter du vanligvis kan arkivere og sende ut via løsningen må nå arkiveres og sendes ut manuelt. Ditt dokument, <em>' + filename + '</em>, vil <strong>ikke</strong> bli arkivert, og må håndteres manuelt. Ta kontakt med arkiv-brukerstøtte dersom du trenger bistand.<br><br>---<br> Mvh  vis-til-arkiv-robot'
    const mailOptions = {
      from: 'ikkeSvar@vtfk.no',
      to: emailAddress,
      subject: 'VIS til Arkiv - løsningen er midlertidig skrudd av grunnet delingen av fylket',
      html: htmlText
    }

    await sendEmail(mailOptions)
  }
}
