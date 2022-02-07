const archiveMethods = {
  VIS001: {
    active: true,
    id: 'VIS001',
    name: 'Fritak for opplæring i kroppsøving',
    findDataMethod: 'soknad',
    archiveTemplate: 'fritak-oppl-kro',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false
  },
  VIS002: {
    active: true,
    id: 'VIS002',
    name: 'Fritak for vurdering med karakter i kroppsøving',
    findDataMethod: 'soknad',
    archiveTemplate: 'fritak-karakter-kro',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false
  },
  VIS003: {
    active: true,
    id: 'VIS003',
    name: 'Fritak for opplæring i sidemål',
    findDataMethod: 'soknad',
    archiveTemplate: 'fritak-oppl-sidemal',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false
  },
  VIS004: {
    active: true,
    id: 'VIS004',
    name: 'Fritak for vurdering med karakter i sidemål',
    findDataMethod: 'soknad',
    archiveTemplate: 'fritak-vurd-karakter-sidemal',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false
  },
  VIS005: {
    active: true,
    id: 'VIS005',
    name: 'Godkjenning av tidligere beståtte fag',
    findDataMethod: 'soknad',
    archiveTemplate: 'godkjenning-tidligere-bestatte-fag',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false
  },
  VIS006: {
    active: true,
    id: 'VIS006',
    name: 'Tilrettelegging ved eksamen og prøver',
    findDataMethod: 'soknad',
    archiveTemplate: 'tilrettelegging-eksamen-prover',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false
  },
  VIS007: {
    active: true,
    id: 'VIS007',
    name: 'Tilrettelegging ved privatisteksamen',
    findDataMethod: 'soknad',
    archiveTemplate: 'tilrettelegging-privatisteksamen',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: true,
    schoolOrgnr: '62000', // optional, overrides school found in document
    accessGroup: 'Eksamen' // optional, overrides accessgroup found in document
  },
  VIS009: {
    active: true,
    id: 'VIS009',
    name: 'Godkjenning av tidligere beståtte fag - VO (voksenopplæring)',
    findDataMethod: 'soknad',
    archiveTemplate: 'godkjenning-tidligere-bestatte-fag-vo',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false,
    schoolOrgnr: '994309153', // optional, overrides school found in document
    accessGroup: 'Elev Kompetansebyggeren' // optional, overrides accessgroup found in document
  },
  VIS011: {
    active: true,
    id: 'VIS011',
    name: 'Forsering av fag',
    findDataMethod: 'soknad',
    archiveTemplate: 'forsering-fag',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false
  },
  VISVarsel: {
    active: true,
    id: 'VISVarsel',
    name: 'Varsel om fare for manglende vurderingsgrunnlag i fag  - VO (voksenopplæring)',
    findDataMethod: 'visVarselDoc',
    identifierStrings: ['Varsel om fare for manglende vurderingsgrunnlag i fag', 'Kompetansebyggeren'],
    archiveTemplate: 'varsel-fare-manglende-vurd-fag-vo',
    internalNoteTemplate: 'internt-notat-varsel',
    internalNote: './data/blockedAddress.pdf',
    svarUt: false,
    manualSvarUt: false,
    schoolOrgnr: '994309153', // optional, overrides school found in document
    accessGroup: 'Elev Kompetansebyggeren' // optional, overrides accessgroup found in document
  },
  VISKarakterutskrift: {
    active: true,
    id: 'VISKarakterutskrift',
    name: 'VIS Karakterutskrift',
    findDataMethod: 'visKarakterutskrift',
    identifierStrings: ['Karakterutskrift', 'Navn:', 'Fødselsnummer:', 'Programområde:', 'Karakter', 'Fravær hele dager', 'Fravær enkelttimer', 'Atferd'],
    splitStrings: ['Karakterutskrift', 'Navn:', 'Fødselsnummer:'],
    archiveTemplate: 'karakterutskrift',
    svarUt: false,
    manualSvarUt: false
  }
}
const standardDocs = ['visVarselDoc', 'visKarakterutskrift']
const soknader = []
const visStandardDocs = []
for (const val of Object.values(archiveMethods)) {
  if (val.findDataMethod === 'soknad') soknader.push(val)
  else if (standardDocs.includes(val.findDataMethod)) visStandardDocs.push(val)
}

module.exports = { archiveMethods, soknader, visStandardDocs }
