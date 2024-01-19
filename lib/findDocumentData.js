const { archiveMethods } = require('../archiveMethods')
const getSchools = require('vtfk-schools-info')
const { schools } = require('../data/wordBook')

const getSchoolInfo = (schoolName, documentType, userEmail) => {
  if (schoolName === 'Feerder videregaende skole') schoolName = 'Færder videregående skole'
  const schoolInfo = {
    schoolName
  }
  if (!archiveMethods[documentType]) throw new Error(`Documenttype ${documentType} is not defined in archiveMethods`)
  if (archiveMethods[documentType].overrideSchool) {
    if (userEmail.split('@')[1] === 'vestfoldfylke.no') {
      schoolInfo.schoolOrgnr = archiveMethods[documentType].vfkOverride.schoolOrgnr
      schoolInfo.schoolAccessGroup = archiveMethods[documentType].vfkOverride.accessGroup
      schoolInfo.schoolCounty = archiveMethods[documentType].vfkOverride.county
      schoolInfo.schoolCountyNumber = archiveMethods[documentType].vfkOverride.countyNumber
    } else if (userEmail.split('@')[1] === 'telemarkfylke.no') {
      schoolInfo.schoolOrgnr = archiveMethods[documentType].tfkOverride.schoolOrgnr
      schoolInfo.schoolAccessGroup = archiveMethods[documentType].tfkOverride.accessGroup
      schoolInfo.schoolCounty = archiveMethods[documentType].tfkOverride.county
      schoolInfo.schoolCountyNumber = archiveMethods[documentType].tfkOverride.countyNumber
    } else {
      throw new Error('@vtfk.no user sent document, but we need @vestfoldfylke or @telemarkfylke to determine which county... you need to manually update filename with correct county :(')
    }
    return schoolInfo
  }
  if (archiveMethods[documentType].schoolOrgnr) schoolInfo.schoolOrgnr = archiveMethods[documentType].schoolOrgnr
  if (archiveMethods[documentType].accessGroup) schoolInfo.schoolAccessGroup = archiveMethods[documentType].accessGroup
  if (archiveMethods[documentType].county) schoolInfo.schoolCounty = archiveMethods[documentType].county
  if (archiveMethods[documentType].countyNumber) schoolInfo.schoolCountyNumber = archiveMethods[documentType].countyNumber

  if (!schoolInfo.schoolOrgnr || !schoolInfo.schoolAccessGroup || !schoolInfo.schoolCounty || !schoolInfo.schoolCountyNumber) {
    const schoolOptions = {
      fullName: (schoolName === 'Kompetansebyggeren Vestfold') ? 'Kompetansebyggeren' : schoolName
    }
    const school = getSchools(schoolOptions)
    if (school.length === 0) throw new Error(`Could not find school data for school with fullname: ${schoolName}`)
    if (school.length > 1) throw new Error(`Found several schools with fullname: ${schoolName}`)
    if (!schoolInfo.schoolOrgnr) schoolInfo.schoolOrgnr = school[0].organizationNumber360
    if (!schoolInfo.schoolAccessGroup) schoolInfo.schoolAccessGroup = school[0].accessGroup
    if (!schoolInfo.schoolCounty) schoolInfo.schoolCounty = school[0].county
    if (!schoolInfo.schoolCountyNumber) schoolInfo.schoolCountyNumber = school[0].countyNumber
  }
  return schoolInfo
}

module.exports = {
  soknad: (documentType, pdfStrings, userEmail) => {
    const documentData = {
      documentType
    }

    const pdfFieldDesc = { // these are the required documentFields for this documentType.
      Fødselsnummer: 'ssn',
      'Elevens navn': 'sName',
      Navn: 'ssName',
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

    if (documentData.ssName && !documentData.sName) documentData.sName = documentData.ssName
    if (documentData.sName && !documentData.ssName) documentData.ssName = documentData.sName

    // School quick fix
    if (archiveMethods[documentType].schoolOrgnr && archiveMethods[documentType].accessGroup) {
      documentData.school = 'Should be overriden by archivemethods'
    }

    // Check if we found all the values we need
    for (const value of Object.values(pdfFieldDesc)) {
      if (!documentData[value]) {
        throw Error(`Could not find value for ${value} in the pdf document, check document`)
      }
    }

    // Get firstName and lastName
    const nameList = documentData.sName.split(' ')
    documentData.lastName = nameList.pop()
    documentData.firstName = nameList.join(' ')

    // Convert documentdate to 360 date format (YYYY-MM-DD)
    const documentDateList = documentData.documentDate.split('.')
    documentData.documentDate = documentDateList[2] + '-' + documentDateList[1] + '-' + documentDateList[0]

    // Get school info
    const schoolInfo = getSchoolInfo(documentData.school, documentType, userEmail)
    documentData.schoolOrgNr = schoolInfo.schoolOrgnr
    documentData.schoolAccessGroup = schoolInfo.schoolAccessGroup
    documentData.schoolCounty = schoolInfo.schoolCounty
    documentData.schoolCountyNumber = schoolInfo.schoolCountyNumber

    return documentData
  },

  visVarselDoc: (documentType, pdfStrings, userEmail) => {
    const documentData = {
      documentType
    }

    const pdfFieldDesc = { // these are the required documentFields for this documentType.
      Fødselsdato: 'birthdate',
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
    documentData.birthdate = infoStringList[1].split('Fødselsdato:')[1].trim()
    documentData.documentDate = dateInfoString.split('Dato:')[1].trim()
    const nameList = documentData.studentName.split(' ')
    documentData.lastName = nameList.pop()
    documentData.firstName = nameList.join(' ')

    // Double check birthdate, because sometimes it does not find the entire birthday...
    if (documentData.birthdate.length !== 10) {
      const entireTxt = pdfStrings.join(' ')
      const birthdate2 = entireTxt.split('Fødselsdato:')[1].replace(/[^0-9/]/g, '').substring(0, 10)
      documentData.birthdate = birthdate2
      if (documentData.birthdate.length !== 10) {
        throw Error('Den forferdelige bursdags-quick-fixen fungerte ikke...')
      }
    }

    // Get school info
    const schoolInfo = getSchoolInfo(documentData.school, documentType, userEmail)
    documentData.schoolOrgNr = schoolInfo.schoolOrgnr
    documentData.schoolAccessGroup = schoolInfo.schoolAccessGroup
    documentData.schoolCounty = schoolInfo.schoolCounty
    documentData.schoolCountyNumber = schoolInfo.schoolCountyNumber

    // Convert birthdate to dsf format
    const birthdateList = documentData.birthdate.split('/')
    documentData.birthdate = `${birthdateList[0]}${birthdateList[1]}${birthdateList[2].substring(2, 4)}`

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
  },
  visKarakterutskriftBirthdate: (documentType, pdfStrings, userEmail) => {
    // Check if this is a pdf with more than one document
    const pdfSentences = []
    for (const item of pdfStrings) {
      pdfSentences.push(...item.split(' ').filter(word => /\S/.test(word)))
    }
    const pdfSentence = pdfSentences.join(' ')
    if (pdfSentence.split('Fødselsdato:').length > 2) return { split: true }

    const documentData = {
      documentType
    }

    const pdfFieldDescription = { // these are the required documentFields for this documentType.
      Fødselsdato: 'birthdate',
      Navn: 'sName',
      Dato: 'documentDate',
      Skole: 'school',
      SkolensOrgNr: 'schoolOrgNr',
      SkolensTilgangsgruppe: 'schoolAccessGroup'
    }

    const pdfFieldDesc = {
      Fødselsdato: 'birthdate',
      Navn: 'sName'
    }

    // Get birthnr
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

    // Get firstName and lastName
    const nameList = documentData.sName.split(' ')
    documentData.lastName = nameList.pop()
    documentData.firstName = nameList.join(' ')

    // Get school and date from pdf
    const foundSchools = []
    const foundDates = []
    let schoolYear
    for (const str of pdfStrings) {
      // Get school
      if (schools.includes(str)) {
        try {
          const schoolInf = getSchoolInfo(str, documentType, userEmail)
          if (!foundSchools.map(s => s.schoolName).includes(schoolInf.schoolName)) foundSchools.push(schoolInf)
        } catch (error) {
        }
      }
      // Get date
      if (str.trim().length === 10 && str.trim().split('.').length === 3 && str.trim().split('.').every(datePart => Number(datePart))) {
        // Convert documentdate to 360 date format (YYYY-MM-DD), and get schoolYear
        const documentDateList = str.trim().split('.')
        schoolYear = (Number(documentDateList[1]) > 7) ? `${documentDateList[2]}/${Number(documentDateList[2]) + 1}` : `${Number(documentDateList[2]) - 1}/${documentDateList[2]}`
        const docDate = documentDateList[2] + '-' + documentDateList[1] + '-' + documentDateList[0]
        if (!foundDates.includes(docDate)) foundDates.push(docDate)
      }
    }
    if (foundSchools.length === 1) {
      documentData.school = foundSchools[0].schoolName
      documentData.schoolOrgNr = foundSchools[0].schoolOrgnr
      documentData.schoolAccessGroup = foundSchools[0].schoolAccessGroup
      documentData.schoolCounty = foundSchools[0].schoolCounty
      documentData.schoolCountyNumber = foundSchools[0].schoolCountyNumber
    } else {
      throw new Error('Found zero or several schools in the pdf')
    }
    if (foundDates.length === 1) {
      documentData.documentDate = foundDates[0]
      documentData.schoolYear = schoolYear
    } else {
      throw new Error('Found zero or several documentDates in the pdf')
    }

    // Get type (nope cannot anymore..)
    /*
    if (pdfSentence.includes('Halvår 2')) { // Finn ut om dette stemmer
      documentData.type = 'T2'
    } else {
      documentData.type = 'T1'
    }
    */

    // Check if we found all the values we need
    for (const value of Object.values(pdfFieldDescription)) {
      if (!documentData[value]) {
        throw new Error(`Could not find value for ${value} in the pdf document, check document`)
      }
    }
    // Cleanup ssn (sometimes, it contains whitespace)
    // documentData.ssn = documentData.ssn.replace(/\s/g, '') // dont have ssn anymore :(
    documentData.sName.replace('  ', ' ') // Just in case :P

    return documentData
  },
  visKarakterutskrift: (documentType, pdfStrings, userEmail) => {
    // Check if this is a pdf with more than one document
    const pdfSentences = []
    for (const item of pdfStrings) {
      pdfSentences.push(...item.split(' ').filter(word => /\S/.test(word)))
    }
    const pdfSentence = pdfSentences.join(' ')
    if (pdfSentence.split('Fødselsnummer:').length > 2) return { split: true }

    const documentData = {
      documentType
    }

    const pdfFieldDescription = { // these are the required documentFields for this documentType.
      Fødselsnummer: 'ssn',
      Navn: 'sName',
      Dato: 'documentDate',
      Skole: 'school',
      SkolensOrgNr: 'schoolOrgNr',
      SkolensTilgangsgruppe: 'schoolAccessGroup',
      KarakterprotoType: 'type'
    }

    const pdfFieldDesc = {
      Fødselsnummer: 'ssn',
      Navn: 'sName'
    }

    // Get birthnr
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

    // Get firstName and lastName
    const nameList = documentData.sName.split(' ')
    documentData.lastName = nameList.pop()
    documentData.firstName = nameList.join(' ')

    // Get school and date from pdf
    const foundSchools = []
    const foundDates = []
    let schoolYear
    for (const str of pdfStrings) {
      // Get school
      if (schools.includes(str)) {
        try {
          const schoolInf = getSchoolInfo(str, documentType, userEmail)
          if (!foundSchools.map(s => s.schoolName).includes(schoolInf.schoolName)) foundSchools.push(schoolInf)
        } catch (error) {
        }
      }
      // Get date
      if (str.trim().length === 10 && str.trim().split('.').length === 3 && str.trim().split('.').every(datePart => Number(datePart))) {
        // Convert documentdate to 360 date format (YYYY-MM-DD), and get schoolYear
        const documentDateList = str.trim().split('.')
        schoolYear = (Number(documentDateList[1]) > 7) ? `${documentDateList[2]}/${Number(documentDateList[2]) + 1}` : `${Number(documentDateList[2]) - 1}/${documentDateList[2]}`
        const docDate = documentDateList[2] + '-' + documentDateList[1] + '-' + documentDateList[0]
        if (!foundDates.includes(docDate)) foundDates.push(docDate)
      }
    }
    if (foundSchools.length === 1) {
      documentData.school = foundSchools[0].schoolName
      documentData.schoolOrgNr = foundSchools[0].schoolOrgnr
      documentData.schoolAccessGroup = foundSchools[0].schoolAccessGroup
      documentData.schoolCounty = foundSchools[0].schoolCounty
      documentData.schoolCountyNumber = foundSchools[0].schoolCountyNumber
    } else {
      throw new Error('Found zero or several schools in the pdf')
    }
    if (foundDates.length === 1) {
      documentData.documentDate = foundDates[0]
      documentData.schoolYear = schoolYear
    } else {
      throw new Error('Found zero or several documentDates in the pdf')
    }

    if (pdfSentence.includes('Halvår 2')) { // Finn ut om dette stemmer
      documentData.type = 'T2'
    } else {
      documentData.type = 'T1'
    }

    // Check if we found all the values we need
    for (const value of Object.values(pdfFieldDescription)) {
      if (!documentData[value]) {
        throw new Error(`Could not find value for ${value} in the pdf document, check document`)
      }
    }
    // Cleanup ssn (sometimes, it contains whitespace)
    documentData.ssn = documentData.ssn.replace(/\s/g, '')
    // documentData.sName.replace('  ', ' ') // Just in case :P

    return documentData
  }
}
