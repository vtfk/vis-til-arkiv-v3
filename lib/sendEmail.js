const nodemailer = require('nodemailer')
const { email } = require('../config')
const { archiveMethods } = require('../archiveMethods')
require('dotenv').config()

const sendEmail = (mail) => {
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

module.exports = {
  emailUnrecognizedDocument: (emailAddress, filename) => {
    const activeMethods = []
    for (const val of Object.values(archiveMethods)) {
      if (val.active) activeMethods.push(val.name)
    }
    let mailStr = '<em>(Dette er en automatisk generert e-post, du kan ikke svare på denne)</em> <br><br> Hei! <br><br> Arkiveringsløsningen VIS til Arkiv (Public 360) kunne ikke håndtere ditt dokument: <em>' + filename + '</em> siden løsningen ikke kunne gjenkjenne dokumenttypen. Ditt dokument vil <strong>ikke</strong> bli behandlet, og slettes automatisk. <br><br>' +
    "<strong>Husk å bruke Adobe Acrobat Reader til å åpne dokumentet før du printer det ut.</strong> Om Adobe Acrobat Reader ikke er satt som standard-program på din pc, <a href='https://helpx.adobe.com/no/acrobat/kb/not-default-pdf-owner-windows10.html'>les her hvordan du setter det som standard</a>, eller kontakt IT-brukerstøtte.<br><br>" +
    'Godkjente svarbrev du kan sende til printeren fra VIS er som følger: <br><ul>'
    for (const method of activeMethods) {
      mailStr += `<li>${method}</li>`
    }
    mailStr += '</ul><br>Dersom du har sendt et slikt dokument fra VIS - vennligst forsikre deg om at du sender det til printeren fra Adobe Acrobat Reader, da dette er et krav for at pdf-en skal bli lesbar.<br><br>--<br> Mvh Seksjon for arkiv og dokumenthåndtering'
    const mailOptions = {
      from: 'ikkeSvar@vtfk.no',
      to: emailAddress,
      subject: 'VIS til Arkiv - ditt dokument ' + filename + ' ble ikke gjenkjent som et gyldig svarbrev fra VIS og vil bli slettet',
      html: mailStr
    }

    sendEmail(mailOptions)
  },
  emailPrinterDisabled: (emailAddress, filename) => {
    const htmlText = '<em>(Dette er en automatisk generert e-post, du kan ikke svare på denne)</em> <br><br> Hei! <br><br> Arkiveringsløsningen VIS til Arkiv (Public 360), er ikke skrudd på da den fortsatt er under testing. Ditt dokument, <em>' + filename + '</em>, vil <strong>ikke</strong> bli behandlet - du kan begynne å bruke løsningen fra og med 1. september. <br><br>---<br> Mvh BDK-TEK'
    const mailOptions = {
      from: 'ikkeSvar@vtfk.no',
      to: emailAddress,
      subject: 'VIS til Arkiv - løsningen er ikke aktiv enda, dokumentet du har sendt til printeren vil ikke bli behandlet',
      html: htmlText
    }

    sendEmail(mailOptions)
  },
  emailServiceUnavailable: (emailAddress, filename) => {
    const htmlText = '<em>(Dette er en automatisk generert e-post, du kan ikke svare på denne)</em> <br><br> Hei! <br><br> Arkiveringsløsningen VIS til Arkiv (Public 360), er skrudd av grunnet delingen av fylket. Dokumenter du vanligvis kan arkivere og sende ut via løsningen må nå arkiveres og sendes ut manuelt. Ditt dokument, <em>' + filename + '</em>, vil <strong>ikke</strong> bli arkivert, og må håndteres manuelt. Ta kontakt med arkiv-brukerstøtte dersom du trenger bistand.<br><br>---<br> Mvh  vis-til-arkiv-robot'
    const mailOptions = {
      from: 'ikkeSvar@vtfk.no',
      to: emailAddress,
      subject: 'VIS til Arkiv - løsningen er midlertidig skrudd av grunnet delingen av fylket',
      html: htmlText
    }

    sendEmail(mailOptions)
  }
}
