# vis-til-arkiv
Nodejs script for archiving Visma InSchool documents, based on pdf-text-recognition

Uses [@vtfk/pdf-text-reader](https://www.npmjs.com/package/@vtfk/pdf-text-reader) for extracting pdf text  
Uses [@vtfk/pdf-splitter](https://www.npmjs.com/package/@vtfk/pdf-text-reader) for extracting pdf text  
Uses [archiveApi/SyncElevmappe](https://github.com/vtfk/azf-archive#post-syncelevmappe) for getting student data as well as creation and updating of *Elevmapper*

## Remarks
- Only tested and used on Windows as far as I know
- Not very suitable for other use cases than archiving pdfs when you do not have any other data than the pdf
- Good luck understanding the code... I am sorry, I take full responsibility

## Setup
### Clone repo
```bash
$ git clone https://github.com/vtfk/vis-til-arkiv-v3
```

### PDFtk
If you want to be able to split pdfs (handle a large pdf-document consisting of several documents of the same type), 
Make sure you have [PDFtk](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/) installed in the same environment as you are running the nodejs script from.

*Use-case: Archiving several 'karakterprotokoller' in the one go - send in 300 protocols in one document, each protocol is handled as a separate document.*  
See [et sted](#somePlace)

### Install dependencies
```bash
$ npm i
```

### Set up .env
```bash
NODE_ENV="production"
ROOT_DIRECTORY="C:/PROD-VIStilArkiv" #This is the root folder for the jobs and documents, can be wherever
STAT_FILE="C:/PROD-VIStilArkiv/stat.json" #A local statistics file
P360_SYNCELEVMAPPE_URL="https://<base_url>/SyncElevmappe" 
P360_SYNCELEVMAPPE_KEY="<key>"
P360_SYNCELEVMAPPE_HEADER_NAME="<authorization_header_name>"
PDFTK_EXT="C:/Program Files (x86)/PDFtk/bin/pdftk"
P360_ARCHIVE_DOC_URL="https://<sif_rpc_api_url>/DocumentService/CreateDocument"
P360_DISPATCH_DOC_URL="https://https://<sif_rpc_api_url>/DocumentService/DispatchDocuments"
P360_ARCHIVE_KEY="<auth_key>"
P360_ARCHIVE_QUERY_STRING="<query_string_property_name_before_the_<auth_key>>"
E18_URL="https://<api_url>/e18"
E18_KEY="<e18_key>"
E18_HEADER_NAME="<authorization_header_name>" 
DELETE_FINISHED_JOBS=false # If true, archived pdfs are deleted, if false, they are put in <imported_folder>
DISPATCH_DIRECTORY_NAME="dispatchInput" #Optional, defaults to "input". Name of folder where script looks for pdfs
DOCUMENT_DIRECTORY_NAME="document" #Optional, defaults to "documents"
DELETE_DIRECTORY_NAME="delete" #Optional, defaults to "delete"
TYPE_SEARCH_WORD="VIS MAL TYPE" #Optional, defaults to "VIS MAL TYPE", used for recognizing documentTypes
TEAMSWEBHOOK_URL="<webhook_url>" #Optional, for alerts in Teams
SMTP_HOST="<smtp_host>" #Optional, for sending emails to users when documents are not recognized as a valid type
SMTP_PORT=<smtp_host> #Optional, for sending emails to users when documents are not recognized as a valid type
PAPERTRAIL_HOST="<papertrail_host>" #Optional, for logging
PAPERTRAIL_TOKEN="<papertrail_token>" #Optional, for logging
```

### Start the script
To see if it runs, the first run will set up necessary directories witihin the ROOT_DIRECTORY
```bash
$ node ./index.js
```

## Usage
### Set up archive method
In *./archiveMethods.js* you can add, disable, or delete methods. Create a method for each documentType you want to archive

**Example method without typeSearchWord**
```js
VISVarsel: {
    active: true, // set to false to disable the method
    id: 'VISVarsel', // set to the same as the property for the whole method. Don't ask why...
    name: 'Varsel om fare for regn',
    findDataMethod: 'visVarselDoc', // Use or create methods defined in "./lib/getData.js"
    identifierStrings: ['Varsel om fare', 'yr'], // Sentences or words that uniquely distinguish this document
    archiveTemplate: 'varsel-fare', // the template used to create archive metadata
    internalNoteTemplate: 'internt-notat-varsel',
    internalNote: './data/blockedAddress.pdf', // If svarUt is used, and the document could not be sent, send note to school
    svarUt: false, // If document should be sent on svarut as well as archived
    manualSvarUt: false, // If you need to manually control the document in P360 before svarut
    schoolOrgnr: '994309153', // optional, overrides school found in document
    accessGroup: 'Elev Kompetansebyggeren' // optional, overrides accessgroup found in document
}
```
**Example method with typeSearchWord**
```js
VIS001: {
    active: true,
    id: 'VIS001', // id is the value found in the document behind "<TYPE_SEARCH_WORD>:"
    name: 'Fritak for opplæring i vær',
    findDataMethod: 'soknad',
    archiveTemplate: 'fritak-oppl-kro',
    internalNoteTemplate: 'internt-notat-svarbrev',
    internalNote: './data/blockedAddress.pdf',
    svarUt: true,
    manualSvarUt: false
  }
```
**Example method with splitting enabled**
```js
VISVarsel: {
    active: true,
    id: 'VISVarsel', 
    name: 'Varsel om fare for regn',
    findDataMethod: 'visVarselDoc', // note that the findDataMethod must check if documents need to be splitted
    identifierStrings: ['Varsel om fare', 'yr'],
    splitStrings: ['Varsel', 'om fare', 'for regn i dag'], // The split strings are words and sentences present on the page you want to split on
    archiveTemplate: 'varsel-fare', 
    svarUt: false, 
    manualSvarUt: false, 
}
```


### Set up archvive template
Create a json file inside the *./templates directory*, reference the template in the corresponding archive method

```json
// Use <<<token>>>, where you want to replace the token with documentData.token, when running createMetadata.js
{
    "Title": "Varsel om fare for regn på <<<day>>>",
    "UnofficialTitle": "Varsel om fare for regn på dag <<<day>>> - <<<month>>> - <<<year>>>",
    "DocumentDate": "<<<documentDate>>>",
    "Archive": "Elevdokument",
    "Category": "Dokument ut",
    "Paragraph": "Offl. § 13 jf. fvl. § 13 (1) nr.1",
    "AccessCodeDescription": "Offl §13 jf. fvl §13 første ledd pkt. 1 - taushetsplikt om værforhold",
    "Status": "J",
    "CaseNumber": "<<<elevmappeCaseNumber>>>",
    "AccessGroup": "<<<schoolAccessGroup>>>",
    "AccessCode": "13",
    "ResponsibleEnterpriseNumber": "<<<schoolOrgNr>>>",
    "Contacts": [
        {
            "ReferenceNumber": "<<<schoolOrgNr>>>",
            "Role": "Avsender",
            "IsUnofficial": false
        },
        {
            "ReferenceNumber": "<<<ssn>>>",
            "Role": "Mottaker",
            "IsUnofficial": true
        }
    ],
    "Files": [
        {
            "Base64Data": "<<<pdfFileBase64>>>",
            "Category": "1",
            "Format": "pdf",
            "Status": "F",
            "Title": "Varsel om fare for regn på <<<day>>>",
            "VersionFormat": "A"
        }
    ]
}
```

## Job-flow
### 1. Dispatch documents
- Get all pdfs in dispatch folder
- Extract text from pdfs, run recognition-methods
- If found an active document type defined in archive methods
    - Move pdf to next job "Get data"
- Else
    - Move to delete, and send email to user that sent document

*If you already know the document-type, you could just put it in the next job and skip this step*
### 2. Get data
- For each archive method
    - For each pdf in archive method get-data folder
        - Extract text and run findDataMethod for this document type
        - Save result and send to next job "sync student data"
### 3. Sync student data
- For each archive method
    - For each pdf in archive method sync-student-data folder
        - Send social security number or birthdate, firstname, lastname to [archiveApi/SyncElevmappe](https://github.com/vtfk/azf-archive#post-syncelevmappe), it handles elevmappe-stuff
        - Save result and send to next job "get archive metadata"
### 3. Get archive metadata
- For each archive method
    - For each pdf in archive method get-archive-metadata folder
        - Send document and studentdata into create-metadata function, along with which archive template to use
        - Save result and send to next job "archive document"
### 4. Archive document
- For each archive method
    - For each pdf in archive method get-archive-metadata folder
        - Send archive metadata along with base64 of pdf to P360
        - If svarut
            - Save result and send to next job "svarut"
        - Else
            - Save result and send to next job "stats and cleanup"
### 5. Svarut
- For each archive method
    - For each pdf in archive method get-archive-metadata folder
        - Send document on svarut to student
        - Save result and send to next job "stats and cleanup"

### 6. Stats and cleanup
- Save statistics and either delete or move pdfs and results to imported folder

# License

[MIT](LICENSE)
