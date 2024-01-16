const { archiveMethods } = require('../archiveMethods')
const { soknad, visVarselDoc, visKarakterutskrift } = require('../lib/findDocumentData')

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
const karakterStrings = ['Fødselsnummer: 12345678910', 'Færder videregående skole', '01.01.1998', 'Halvår 1', 'blablabla', 'Navn: Bjørge Flatlus']
const expectKarakterRes = {
  ssn: '12345678910',
  documentDate: '1998-01-01',
  school: 'Færder videregående skole',
  schoolOrgNr: '974575086',
  schoolAccessGroup: 'Elev Færder vgs',
  type: 'T1'
}
const karakterStringsWithDuplicatePropButSameVal = ['Fødselsnummer: 12345678910', 'Fødselsnummer: 12345678910', 'Færder videregående skole', '01.01.1998', 'Halvår 1', 'blablabla', 'Navn: Bjørge Flatlus']
const karakterStringsWithDuplicatePropDiffVal = ['Fødselsnummer: 12345678910', 'Fødselsnummer: 22222222222', 'Færder videregående skole', '01.01.1998', 'Halvår 1', 'blablabla', 'Navn: Bjørge Flatlus']
const karakterStringsMissingProp = ['Færder videregående skole', '01.01.1998', 'Halvår 1', 'blablabla', 'Navn: Bjørge Flatlus']

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
  test('visKarakterutskrift', () => {
    for (const [method, options] of Object.entries(archiveMethods).filter(method => method[1].findDataMethod === 'visKarakterutskrift')) {
      const documentData = visKarakterutskrift(method, karakterStrings, 'gunnar@vestfoldfylke.no')
      expect(documentData.documentType).toBe(method)
      expect(documentData.ssn).toBe(expectKarakterRes.ssn)
      expect(documentData.documentDate).toBe(expectKarakterRes.documentDate)
      expect(documentData.school).toBe(expectKarakterRes.school)
      expect(documentData.type).toBe(expectKarakterRes.type)
      if (options.schoolOrgnr) {
        expect(documentData.schoolOrgNr).toBe(options.schoolOrgnr)
      } else {
        expect(documentData.schoolOrgNr).toBe(expectSoknadRes.schoolOrgNr)
      }
      if (options.accessGroup) {
        expect(documentData.schoolAccessGroup).toBe(options.accessGroup)
      }
    }
  })
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
    })
  }
})
