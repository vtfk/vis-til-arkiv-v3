const { archiveMethods } = require('../archiveMethods')
const getSchools = require('vtfk-schools-info')

const getSchoolInfo = (schoolName, documentType) => {
  const schoolInfo = {}
  if (!archiveMethods[documentType]) throw new Error(`Documenttype ${documentType} is not defined in archiveMethods`)
  if (archiveMethods[documentType].schoolOrgnr) schoolInfo.schoolOrgnr = archiveMethods[documentType].schoolOrgnr
  if (archiveMethods[documentType].accessGroup) schoolInfo.schoolAccessGroup = archiveMethods[documentType].accessGroup

  if (!schoolInfo.schoolOrgnr || !schoolInfo.schoolAccessGroup) {
    const schoolOptions = {
      fullName: (schoolName === 'Kompetansebyggeren Vestfold') ? 'Kompetansebyggeren' : schoolName
    }
    const school = getSchools(schoolOptions)
    if (school.length === 0) throw new Error(`Could not find school data for school with fullname: ${schoolName}`)
    if (school.length > 1) throw new Error(`Found several schools with fullname: ${schoolName}`)
    if (!schoolInfo.schoolOrgnr) schoolInfo.schoolOrgnr = school[0].organizationNumber360
    if (!schoolInfo.schoolAccessGroup) schoolInfo.schoolAccessGroup = school[0].accessGroup
  }
  return schoolInfo
}

module.exports = {
  soknad: (documentType, pdfStrings) => {
    const documentData = {
      documentType
    }

    const pdfFieldDesc = { // these are the required documentFields for this documentType.
      Fødselsnummer: 'studentBirthnr',
      Skole: 'school',
      Dato: 'documentDate'
    }

    for (let i = 0; i < pdfStrings.length; i++) { // Note that field description and value is found in the same element (str) in this documentType, where the description field and values are found is dependent on the structure of the pdf
      if (pdfStrings[i].split(':').length === 2) {
        const desc = pdfStrings[i].split(':')[0].trim()
        const value = pdfStrings[i].split(':')[1].trim()
        if (pdfFieldDesc[desc] !== undefined) { // this is a field we are looking for
          if (documentData[pdfFieldDesc[desc]] !== undefined && documentData[pdfFieldDesc[desc]] !== value) { // Check if this field is already found, if so, throw error
            throw Error(`Found duplicate description field with different values: ${desc}, pdf is not set up correctly in VIS, contact school VIS administrator`)
          } else {
            documentData[pdfFieldDesc[desc]] = value
          }
        }
      }
    }

    // Check if we found all the values we need
    for (const value of Object.values(pdfFieldDesc)) {
      if (!documentData[value]) {
        throw Error(`Could not find value for ${value} in the pdf document, check document`)
      }
    }

    // Convert documentdate to 360 date format (YYYY-MM-DD)
    const documentDateList = documentData.documentDate.split('.')
    documentData.documentDate = documentDateList[2] + '-' + documentDateList[1] + '-' + documentDateList[0]

    // Get school info
    const schoolInfo = getSchoolInfo(documentData.school, documentType)
    documentData.schoolOrgnr = schoolInfo.schoolOrgnr
    documentData.schoolAccessGroup = schoolInfo.schoolAccessGroup

    return documentData
  },

  visVarselDoc: (documentType, pdfStrings) => {
    const documentData = {
      documentType
    }

    const pdfFieldDesc = { // these are the required documentFields for this documentType.
      Fødselsdato: 'studentBirthdate',
      Elev: 'studentName',
      Dato: 'documentDate',
      Fag: 'course'
    }

    let infoString = false
    let dateInfoString = false
    for (const str of pdfStrings) {
      if (str.includes('Elev:') && str.includes('Klasse:') && str.includes('Fødselsdato:')) {
        infoString = str
      } else if (str.includes('Sted:') && str.includes('Dato:')) {
        dateInfoString = str
      } else if (str.includes('Fag:')) {
        documentData.course = str.split('Fag:')[1].trim()
      }
    }
    if (!infoString) throw new Error('Missing "Elev", "Klasse", or "Fødselsdato" from pdf, check the pdf')
    if (!dateInfoString) throw new Error('Missing "Sted" or "Dato" from pdf, check the pdf')
    if (!documentData.course) throw new Error('Missing "Fag" from pdf, check the pdf')

    // Check if this is a pdf with more than one document
    const pdfSentences = []
    for (const item of pdfStrings) {
      pdfSentences.push(...item.split(' ').filter(word => /\S/.test(word)))
    }
    const pdfSentence = pdfSentences.join(' ')
    if (pdfSentence.split('Fødselsdato:').length > 2) throw new Error('Found several visVarsel in one file, needs splitting or something. Do something')

    const infoStringList = infoString.split('Elev:')[1].split('Klasse:')
    documentData.studentName = infoStringList[0].trim()
    documentData.studentBirthdate = infoStringList[1].split('Fødselsdato:')[1].trim()
    documentData.documentDate = dateInfoString.split('Dato:')[1].trim()

    // Double check birthdate, because sometimes it does not find the entire birthday...
    if (documentData.studentBirthdate.length !== 10) {
      const entireTxt = pdfStrings.join(' ')
      const birthdate2 = entireTxt.split('Fødselsdato:')[1].replace(/[^0-9/]/g, '').substring(0, 10)
      documentData.studentBirthdate = birthdate2
      if (documentData.studentBirthdate.length !== 10) {
        throw Error('Den forferdelige bursdags-quick-fixen fungerte ikke...')
      }
    }

    // Get school info
    const schoolInfo = getSchoolInfo(documentData.school, documentType)
    documentData.schoolOrgnr = schoolInfo.schoolOrgnr
    documentData.schoolAccessGroup = schoolInfo.schoolAccessGroup

    // Convert documentdate to 360 date format (YYYY-MM-DD)
    const documentDateList = documentData.documentDate.split('.')
    documentData.documentDate = documentDateList[2] + '-' + documentDateList[1] + '-' + documentDateList[0]

    // Check if we found all the values we need
    for (const value of Object.values(pdfFieldDesc)) {
      if (!documentData[value]) {
        throw new Error(`Could not find value for ${value} in the pdf document, check document`)
      }
    }
    return documentData
  }
}
