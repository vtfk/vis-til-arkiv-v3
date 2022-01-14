const archiveMethods = {
  VIS001: {
    active: true,
    id: 'VIS001',
    name: 'Fritak for opplæring i kroppsøving',
    findDataMethod: 'soknad',
    archiveTemplate: 'fritak-oppl-kro',
    svarUt: true,
    manualSvarUt: true
  },
  VIS002: {
    id: 'VIS002',
    name: 'Fritak for vurdering med karakter i kroppsøving',
    findDataMethod: 'soknad',
    archiveTemplate: 'fritak-vurd-kro',
    svarUt: true,
    manualSvarUt: true
  },
  VIS007: {
    id: 'VIS007',
    name: 'Tilrettelegging ved privatisteksamen',
    test: true,
    findDataMethod: 'soknad',
    archiveTemplate: 'tilrettelegging-priv-eks',
    svarUt: true,
    manualSvarUt: true,
    schoolOrgnr: '62000', // optional
    accessGroup: 'Eksamen' // optional
  },
  VISVarsel: {
    id: 'VISVarsel',
    name: 'Varsel om fare for manglende vurderingsgrunnlag i fag  - VO (voksenopplæring)',
    test: true,
    findDataMethod: 'visVarselDoc',
    identifierStrings: ['Varsel om fare for manglende vurderingsgrunnlag i fag', 'Kompetansebyggeren', 'Varselet gjelder:'],
    archiveTemplate: 'varsel-vo',
    svarUt: false,
    manualSvarUt: false,
    schoolOrgnr: '994309153',
    accessGroup: 'Elev Kompetansebyggeren'
  },
  VISKarakterProt: {
    id: 'VISKarakterProt',
    name: 'VIS Karakterprotokoll',
    test: true,
    findDataMethod: 'vis-karakter-prot',
    identifierStrings: ['Karakterutskrift', 'Navn:', 'Fødselsnummer:', 'Programområde', 'Karakter', 'Fravær hele dager', 'Fravær enkelttimer', 'Atferd'],
    archiveTemplate: 'karakterprotokoll',
    svarUt: false,
    manualSvarUt: false
  }
}

const standardDocs = ['visVarselDoc', 'visKarakterProt']
const soknader = []
const visStandardDocs = []
for (const val of Object.values(archiveMethods)) {
  if (val.findDataMethod === 'soknad') soknader.push(val)
  else if (standardDocs.includes(val.findDataMethod)) visStandardDocs.push(val)
}

module.exports = { archiveMethods, soknader, visStandardDocs }
