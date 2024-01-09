const archiveMethods = {
  VIS001: {
    active: false,
    id: 'VIS001',
    name: 'Fritak for opplæring i kroppsøving',
    findDataMethod: 'soknad',
    archiveTemplate: 'fritak-oppl-kro',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false,
    archiveOriginal: true,
    archiveOcr: false
  },
  VIS002: {
    active: false,
    id: 'VIS002',
    name: 'Fritak for vurdering med karakter i kroppsøving',
    findDataMethod: 'soknad',
    archiveTemplate: 'fritak-karakter-kro',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false,
    archiveOriginal: true,
    archiveOcr: false
  },
  VIS003: {
    active: false,
    id: 'VIS003',
    name: 'Fritak for opplæring i sidemål',
    findDataMethod: 'soknad',
    archiveTemplate: 'fritak-oppl-sidemal',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false,
    archiveOriginal: true,
    archiveOcr: false
  },
  VIS004: {
    active: false,
    id: 'VIS004',
    name: 'Fritak for vurdering med karakter i sidemål',
    findDataMethod: 'soknad',
    archiveTemplate: 'fritak-vurd-karakter-sidemal',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false,
    archiveOriginal: true,
    archiveOcr: false
  },
  VIS005: {
    active: false,
    id: 'VIS005',
    name: 'Godkjenning av tidligere beståtte fag',
    findDataMethod: 'soknad',
    archiveTemplate: 'godkjenning-tidl-bestatte-fag',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false,
    archiveOriginal: true,
    archiveOcr: false
  },
  VIS006: {
    active: false,
    id: 'VIS006',
    name: 'Tilrettelegging ved eksamen og prøver',
    findDataMethod: 'soknad',
    archiveTemplate: 'tilrettelegging-eksamen-prover',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false,
    archiveOriginal: true,
    archiveOcr: false
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
    manualSvarUt: false,
    schoolOrgnr: '62000', // optional, overrides school found in document
    accessGroup: 'Eksamen', // optional, overrides accessgroup found in document
    archiveOriginal: true,
    archiveOcr: false
  },
  VIS009: {
    active: false,
    id: 'VIS009',
    name: 'Godkjenning av tidligere beståtte fag - VO (voksenopplæring)',
    findDataMethod: 'soknad',
    archiveTemplate: 'godkjenning-tidl-bestatte-fag-vo',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false,
    schoolOrgnr: '994309153', // optional, overrides school found in document
    accessGroup: 'Elev Kompetansebyggeren', // optional, overrides accessgroup found in document
    archiveOriginal: true,
    archiveOcr: false
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
    manualSvarUt: false,
    archiveOriginal: true,
    archiveOcr: false
  },
  VIS012: {
    active: true,
    id: 'VIS012',
    name: 'Bekreftelse på mottak av søknad',
    findDataMethod: 'soknad',
    archiveTemplate: 'mottatt-soknad',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false,
    archiveOriginal: true,
    archiveOcr: false
  },
  VISVarsel: {
    active: false,
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
    accessGroup: 'Elev Kompetansebyggeren', // optional, overrides accessgroup found in document
    archiveOriginal: true,
    archiveOcr: false
  },
  VISKarakterutskrift: {
    active: true,
    id: 'VISKarakterutskrift',
    name: 'VIS Karakterutskrift',
    findDataMethod: 'visKarakterutskrift',
    identifierStrings: ['Karakterutskrift', 'Navn:', 'Fødselsnummer:', 'Programområde:', 'Karakter', 'hele dager', 'enkelttimer', 'Signatur'],
    splitStrings: ['Karakterutskrift', 'Navn:', 'Fødselsnummer:'],
    archiveTemplate: 'karakterutskrift',
    svarUt: false,
    manualSvarUt: false,
    archiveOriginal: true,
    archiveOcr: false,
    pageLimit: 1
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
