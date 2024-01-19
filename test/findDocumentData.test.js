const { archiveMethods } = require('../archiveMethods')
const { soknad, visVarselDoc, visKarakterutskrift, visKarakterutskriftBirthdate } = require('../lib/findDocumentData')

// Soknad
const soknadStrings = ['Fødselsnummer: 12345678910', 'Skole: Færder videregående skole', 'Dato: 01.01.1998', 'Elevens navn: Bjørge Trynesen']
const expectSoknadRes = {
  ssn: '12345678910',
  documentDate: '1998-01-01',
  school: 'Færder videregående skole',
  schoolOrgNr: '974575086',
  schoolAccessGroup: 'Elev Færder vgs'
}
const soknadStringsDuplicatePropButSameVal = ['Fødselsnummer: 12345678910', 'Fødselsnummer: 12345678910', 'Skole: Færder videregående skole', 'Dato: 01.01.1998', 'Elevens navn: Bjørge Trynesen']
const soknadStringsDuplicatePropDiffVal = ['Fødselsnummer: 12345678910', 'Fødselsnummer: 22222222222', 'Skole: Færder videregående skole', 'Dato: 01.01.1998', 'Elevens navn: Bjørge Trynesen']
const soknadStringsMissingProp = ['Skole: Færder videregående skole', 'Dato: 01.01.1998', 'Elevens navn: Bjørge Trynesen']
const soknadStringsNotValidSchool = ['Fødselsnummer: 12345678910', 'Skole: Livets skole', 'Dato: 01.01.1998', 'Elevens navn: Bjørge Trynesen']

// visVarselDoc
const visVarselStrings = ['Elev: Bjarne Betjent Klasse: 2STA Fødselsdato: 29/01/1995', 'Fag:NOR1264 Norsk, skriftlig', 'Kompetansebyggeren', 'Sted: Stathelle Dato: 02.11.2021', 'Varsel om fare for manglende vurderingsgrunnlag i fag']
const expectVarselRes = {
  birthdate: '290195',
  studentName: 'Bjarne Betjent',
  firstName: 'Bjarne',
  lastName: 'Betjent',
  documentDate: '2021-11-02',
  school: 'Kompetansebyggeren',
  schoolOrgNr: '994309153',
  schoolAccessGroup: 'Elev Kompetansebyggeren',
  course: 'NOR1264 Norsk, skriftlig'
}
const visVarselStringsDuplicatePropDiffVal = ['Elev: Bjarne Betjent Klasse: 2STA Fødselsdato: 29/01/1996', 'Elev: Bjarne Betjent Klasse: 2STA Fødselsdato: 29/01/1995', 'Fag:NOR1264 Norsk, skriftlig', 'Kompetansebyggeren', 'Sted: Stathelle Dato: 02.11.2021', 'Varsel om fare for manglende vurderingsgrunnlag i fag']
const visVarselStringsMissingProp = ['Fag:NOR1264 Norsk, skriftlig', 'Kompetansebyggeren', 'Sted: Stathelle Dato: 02.11.2021', 'Varsel om fare for manglende vurderingsgrunnlag i fag']

// visKarakterutskrift
const karakterStringsVestfold = ['Fødselsnummer: 12345678910', 'Færder videregående skole', '15.01.2024', 'blablabla', 'Navn: Bjørge Flatlus']
const karakterStringsTelemark = ['Fødselsnummer: 10987654321', 'Bamble videregående skole', '02.03.2024', 'blablabla', 'Navn: Bjørge Flatlus']

const expectKarakterResVestfold = {
  ssn: '12345678910',
  documentDate: '2024-01-15',
  school: 'Færder videregående skole',
  schoolOrgNr: '974575086',
  schoolAccessGroup: 'Elev Færder vgs',
  schoolCounty: 'Vestfold',
  schoolCountyNumber: '39',
  schoolYear: '2023/2024',
  type: 'T1'
}
const expectKarakterResTelemark = {
  ssn: '10987654321',
  documentDate: '2024-03-02',
  school: 'Bamble videregående skole',
  schoolOrgNr: '974568098',
  schoolAccessGroup: 'Elev Bamble vgs',
  schoolCounty: 'Telemark',
  schoolCountyNumber: '40',
  schoolYear: '2023/2024',
  type: 'T1'
}

const karakterStringsWithDuplicatePropButSameVal = ['Fødselsnummer: 12345678910', 'Fødselsnummer: 12345678910', 'Færder videregående skole', '01.01.1998', 'Halvår 1', 'blablabla', 'Navn: Bjørge Flatlus']
const karakterStringsWithDuplicatePropDiffVal = ['Fødselsnummer: 12345678910', 'Fødselsnummer: 10987654321', 'Færder videregående skole', '01.01.1998', 'Halvår 1', 'blablabla', 'Navn: Bjørge Flatlus']
const karakterStringsMissingProp = ['Færder videregående skole', '01.01.1998', 'Halvår 1', 'blablabla', 'Navn: Bjørge Flatlus']

const karakterStringsBirthdateVestfold = [
  'Færder videregående skole',
  'Sundbykåsa 29',
  '3961 STATHELLE',
  'Karakterutskrift',
  'Færder videregående skole',
  '2023-2024',
  'Navn: Vis Testelev',
  'Fødselsdato: 24.09.1976',
  'Programområde: STSSA3----',
  'Karakter',
  'Fagkode Fagnavn H1 H2 Standpunkt',
  'NOR1268 Norsk sidemål, vg3 studieforberedende',
  'utdanningsprogram, skriftlig',
  'NOR1269 Norsk, vg3 studieforberedende',
  'utdanningsprogram, muntlig',
  'NOR1267 Norsk hovedmål, vg3 studieforberedende',
  'utdanningsprogram, skriftlig',
  'HIS1010 Historie Vg3 studieforberedende',
  'utdanningsprogram',
  'KRO1019 Kroppsøving Vg3 GK GK',
  'REL1003 Religion og etikk IV',
  'Elevfravær Orden og Afterd',
  'Type Type H1 H2Standpunkt',
  'Fravær hele dager 2 Orden',
  'Fravær enkelttimer 13.5 Afterd',
  'Signatur',
  '15.01.2024'
]

const karakterStringsBirthdateTelemark = [
  'Bamble videregående skole',
  'Sundbykåsa 29',
  '3961 STATHELLE',
  'Karakterutskrift',
  'Bamble videregående skole',
  '2023-2024',
  'Navn: Vis Testelev',
  'Fødselsdato: 24.09.1976',
  'Programområde: STSSA3----',
  'Karakter',
  'Fagkode Fagnavn H1 H2 Standpunkt',
  'NOR1268 Norsk sidemål, vg3 studieforberedende',
  'utdanningsprogram, skriftlig',
  'NOR1269 Norsk, vg3 studieforberedende',
  'utdanningsprogram, muntlig',
  'NOR1267 Norsk hovedmål, vg3 studieforberedende',
  'utdanningsprogram, skriftlig',
  'HIS1010 Historie Vg3 studieforberedende',
  'utdanningsprogram',
  'KRO1019 Kroppsøving Vg3 GK GK',
  'REL1003 Religion og etikk IV',
  'Elevfravær Orden og Afterd',
  'Type Type H1 H2Standpunkt',
  'Fravær hele dager 2 Orden',
  'Fravær enkelttimer 13.5 Afterd',
  'Signatur',
  '15.01.2024'
]

const expectKarakterBirthdateResVestfold = {
  birthdate: '24.09.1976',
  documentDate: '2024-01-15',
  school: 'Færder videregående skole',
  schoolOrgNr: '974575086',
  schoolAccessGroup: 'Elev Færder vgs',
  schoolCounty: 'Vestfold',
  schoolCountyNumber: '39',
  schoolYear: '2023/2024'
}
const expectKarakterBirthdateResTelemark = {
  birthdate: '24.09.1976',
  documentDate: '2024-01-15',
  school: 'Bamble videregående skole',
  schoolOrgNr: '974568098',
  schoolAccessGroup: 'Elev Bamble vgs',
  schoolCounty: 'Telemark',
  schoolCountyNumber: '40',
  schoolYear: '2023/2024'
}
const karakterBirthdateStringsWithDuplicatePropButSameVal = ['Fødselsdato: 24.09.1976', 'Fødselsdato: 24.09.1976', 'Færder videregående skole', '01.01.1998', 'Halvår 1', 'blablabla', 'Navn: Bjørge Flatlus']
const karakterBirthdateStringsWithDuplicatePropDiffVal = ['Fødselsdato: 24.10.1993', 'Fødselsdato: 24.09.1976', 'Færder videregående skole', '01.01.1998', 'Halvår 1', 'blablabla', 'Navn: Bjørge Flatlus']
const karakterBirthdateStringsMissingProp = ['Færder videregående skole', '01.01.1998', 'Halvår 1', 'blablabla', 'Navn: Bjørge Flatlus']

describe('Finds correct data for archivemethod', () => {
  test('soknad', () => {
    for (const [method, options] of Object.entries(archiveMethods).filter(method => method[1].findDataMethod === 'soknad')) {
      const documentData = soknad(method, soknadStrings, 'gunnar@vestfoldfylke.no') // hardcoded vestfold - so we expect vestfold in override
      expect(documentData.documentType).toBe(method)
      expect(documentData.ssn).toBe(expectSoknadRes.ssn)
      expect(documentData.documentDate).toBe(expectSoknadRes.documentDate)
      expect(documentData.school).toBe(expectSoknadRes.school)
      if (options.overrideSchool) {
        expect(documentData.schoolOrgNr).toBe(options.vfkOverride.schoolOrgnr)
      } else {
        expect(documentData.schoolOrgNr).toBe(expectSoknadRes.schoolOrgNr)
      }
      if (options.overrideSchool) {
        expect(documentData.schoolAccessGroup).toBe(options.vfkOverride.accessGroup)
      } else {
        expect(documentData.schoolAccessGroup).toBe(expectSoknadRes.schoolAccessGroup)
      }
    }
  })
  test('visVarselDoc', () => {
    for (const [method, options] of Object.entries(archiveMethods).filter(method => method[1].findDataMethod === 'visVarselDoc')) {
      const documentData = visVarselDoc(method, visVarselStrings, 'gunnar@vestfoldfylke.no')
      expect(documentData.documentType).toBe(method)
      expect(documentData.firstName).toBe(expectVarselRes.firstName)
      expect(documentData.lastName).toBe(expectVarselRes.lastName)
      expect(documentData.documentDate).toBe(expectVarselRes.documentDate)
      expect(documentData.birthdate).toBe(expectVarselRes.birthdate)
      expect(documentData.course).toBe(expectVarselRes.course)
      if (options.overrideSchool) {
        expect(documentData.schoolOrgNr).toBe(options.vfkOverride.schoolOrgnr)
      } else {
        expect(documentData.schoolOrgNr).toBe(expectSoknadRes.schoolOrgNr)
      }
      if (options.overrideSchool) {
        expect(documentData.schoolAccessGroup).toBe(options.vfkOverride.accessGroup)
      } else {
        expect(documentData.schoolAccessGroup).toBe(expectSoknadRes.schoolAccessGroup)
      }
    }
  })
  test('visKarakterutskrift vestfold', () => {
    for (const [method, options] of Object.entries(archiveMethods).filter(method => method[1].findDataMethod === 'visKarakterutskrift')) {
      const documentData = visKarakterutskrift(method, karakterStringsVestfold, 'gunnar@vestfoldfylke.no')
      expect(documentData.documentType).toBe(method)
      expect(documentData.ssn).toBe(expectKarakterResVestfold.ssn)
      expect(documentData.documentDate).toBe(expectKarakterResVestfold.documentDate)
      expect(documentData.school).toBe(expectKarakterResVestfold.school)
      expect(documentData.schoolCounty).toBe(expectKarakterResVestfold.schoolCounty)
      expect(documentData.schoolCountyNumber).toBe(expectKarakterResVestfold.schoolCountyNumber)
      expect(documentData.schoolAccessGroup).toBe(expectKarakterResVestfold.schoolAccessGroup)
      expect(documentData.schoolYear).toBe(expectKarakterResVestfold.schoolYear)
      expect(documentData.type).toBe(expectKarakterResVestfold.type)
    }
  })
  test('visKarakterutskrift telemark', () => {
    for (const [method, options] of Object.entries(archiveMethods).filter(method => method[1].findDataMethod === 'visKarakterutskrift')) {
      const documentData = visKarakterutskrift(method, karakterStringsTelemark, 'gunnar@telemarkfylke.no')
      expect(documentData.documentType).toBe(method)
      expect(documentData.ssn).toBe(expectKarakterResTelemark.ssn)
      expect(documentData.documentDate).toBe(expectKarakterResTelemark.documentDate)
      expect(documentData.school).toBe(expectKarakterResTelemark.school)
      expect(documentData.schoolCounty).toBe(expectKarakterResTelemark.schoolCounty)
      expect(documentData.schoolCountyNumber).toBe(expectKarakterResTelemark.schoolCountyNumber)
      expect(documentData.schoolAccessGroup).toBe(expectKarakterResTelemark.schoolAccessGroup)
      expect(documentData.schoolYear).toBe(expectKarakterResTelemark.schoolYear)
      expect(documentData.type).toBe(expectKarakterResVestfold.type)
    }
  })
})
test('visKarakterutskriftBirthdate vestfold', () => {
  for (const [method, options] of Object.entries(archiveMethods).filter(method => method[1].findDataMethod === 'visKarakterutskrift')) {
    const documentData = visKarakterutskriftBirthdate(method, karakterStringsBirthdateVestfold, 'gunnar@vestfoldfylke.no')
    expect(documentData.documentType).toBe(method)
    expect(documentData.birthdate).toBe(expectKarakterBirthdateResVestfold.birthdate)
    expect(documentData.documentDate).toBe(expectKarakterBirthdateResVestfold.documentDate)
    expect(documentData.school).toBe(expectKarakterBirthdateResVestfold.school)
    expect(documentData.schoolCounty).toBe(expectKarakterBirthdateResVestfold.schoolCounty)
    expect(documentData.schoolCountyNumber).toBe(expectKarakterBirthdateResVestfold.schoolCountyNumber)
    expect(documentData.schoolAccessGroup).toBe(expectKarakterBirthdateResVestfold.schoolAccessGroup)
    expect(documentData.schoolYear).toBe(expectKarakterBirthdateResVestfold.schoolYear)
  }
})
test('visKarakterutskriftBirthdate telemark', () => {
  for (const [method, options] of Object.entries(archiveMethods).filter(method => method[1].findDataMethod === 'visKarakterutskrift')) {
    const documentData = visKarakterutskriftBirthdate(method, karakterStringsBirthdateTelemark, 'gunnar@telemarkfylke.no')
    expect(documentData.documentType).toBe(method)
    expect(documentData.birthdate).toBe(expectKarakterBirthdateResTelemark.birthdate)
    expect(documentData.documentDate).toBe(expectKarakterBirthdateResTelemark.documentDate)
    expect(documentData.school).toBe(expectKarakterBirthdateResTelemark.school)
    expect(documentData.schoolCounty).toBe(expectKarakterBirthdateResTelemark.schoolCounty)
    expect(documentData.schoolCountyNumber).toBe(expectKarakterBirthdateResTelemark.schoolCountyNumber)
    expect(documentData.schoolAccessGroup).toBe(expectKarakterBirthdateResTelemark.schoolAccessGroup)
    expect(documentData.schoolYear).toBe(expectKarakterBirthdateResTelemark.schoolYear)
  }
})

describe('Method "soknad" with documenttype', () => {
  for (const [method, options] of Object.entries(archiveMethods).filter(method => method[1].findDataMethod === 'soknad')) {
    describe(`${method} (active: ${options.active})`, () => {
      test('succeeds when strings contain duplicate property with same values', () => {
        const documentData = soknad(method, soknadStringsDuplicatePropButSameVal, 'gunnar@vestfoldfylke.no')
        expect(documentData.documentType).toBe(method)
        expect(documentData.ssn).toBe(expectSoknadRes.ssn)
      })
      test('fails when strings contain duplicate property with different values', () => {
        const fn = () => soknad(method, soknadStringsDuplicatePropDiffVal, 'gunnar@vestfoldfylke.no')
        expect(fn).toThrow('Found duplicate description')
      })
      test('fails when strings are missing required property', () => {
        const fn = () => soknad(method, soknadStringsMissingProp, 'gunnar@vestfoldfylke.no')
        expect(fn).toThrow('Could not find value for')
      })
      test('fails when strings are missing a valid school name, and school overrride is not set', () => {
        const fn = () => soknad(method, soknadStringsNotValidSchool, 'gunnar@vestfoldfylke.no')
        if (!options.overrideSchool) {
          expect(fn).toThrow('Could not find school data')
        }
      })
    })
  }
})

describe('Method "visVarselDoc" with documenttype', () => {
  for (const [method, options] of Object.entries(archiveMethods).filter(method => method[1].findDataMethod === 'visVarselDoc')) {
    describe(`${method} (active: ${options.active})`, () => {
      test('fails when strings contain duplicate property with same values', () => {
        const fn = () => visVarselDoc(method, visVarselStringsDuplicatePropDiffVal, 'gunnar@vestfoldfylke.no')
        expect(fn).toThrow('Found several visVarsel in one file')
      })
      test('fails when strings contain duplicate property with different values', () => {
        const fn = () => visVarselDoc(method, visVarselStringsDuplicatePropDiffVal, 'gunnar@vestfoldfylke.no')
        expect(fn).toThrow('Found several visVarsel in one file')
      })
      test('fails when strings are missing required property', () => {
        const fn = () => visVarselDoc(method, visVarselStringsMissingProp, 'gunnar@vestfoldfylke.no')
        expect(fn).toThrow('Missing')
      })
    })
  }
})

describe('Method "visKarakterutskrift" with documenttype', () => {
  for (const [method, options] of Object.entries(archiveMethods).filter(method => method[1].findDataMethod === 'visKarakterutskrift')) {
    describe(`${method} (active: ${options.active})`, () => {
      test('set split to true if it finds duplicate props (with same value)', () => {
        const documentData = visKarakterutskrift(method, karakterStringsWithDuplicatePropButSameVal, 'gunnar@vestfoldfylke.no')
        expect(documentData.split).toBe(true)
      })
      test('set split to true if it finds duplicate props (with different value)', () => {
        const documentData = visKarakterutskrift(method, karakterStringsWithDuplicatePropDiffVal, 'gunnar@vestfoldfylke.no')
        expect(documentData.split).toBe(true)
      })
      test('fails when strings are missing required property', () => {
        const fn = () => visKarakterutskrift(method, karakterStringsMissingProp, 'gunnar@vestfoldfylke.no')
        expect(fn).toThrow('Could not find')
      })
      test('set split to true if it finds duplicate props (with same value)', () => {
        const documentData = visKarakterutskriftBirthdate(method, karakterBirthdateStringsWithDuplicatePropButSameVal, 'gunnar@vestfoldfylke.no')
        expect(documentData.split).toBe(true)
      })
      test('set split to true if it finds duplicate props (with different value)', () => {
        const documentData = visKarakterutskriftBirthdate(method, karakterBirthdateStringsWithDuplicatePropDiffVal, 'gunnar@vestfoldfylke.no')
        expect(documentData.split).toBe(true)
      })
      test('fails when strings are missing required property', () => {
        const fn = () => visKarakterutskriftBirthdate(method, karakterBirthdateStringsMissingProp, 'gunnar@vestfoldfylke.no')
        expect(fn).toThrow('Could not find')
      })
    })
  }
})
