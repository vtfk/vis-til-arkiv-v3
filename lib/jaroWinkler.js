const jw = require('jaro-winkler')
const jaroThreshold = 0.933

const jwIncludes = (word, words, threshold) => {
  if (!threshold) threshold = jaroThreshold
  return words.some(w => jw(word, w) > threshold)
}

const similar = (str1, str2, threshold) => {
  if (!threshold) threshold = jaroThreshold
  return jw(str1, str2) > threshold
}

const bagOfSentences = (string, wordCount) => {
  const sentences = []
  const words = string.split(' ')
  if (words.length <= wordCount) return [string]
  for (let i = 0; i < (words.length - wordCount + 1); i++) {
    sentences.push(words.slice(i, i + wordCount).join(' '))
  }
  return sentences
}

const jwIncludesSentence = (sentence, text, threshold) => {
  if (!threshold) threshold = jaroThreshold
  const bag = bagOfSentences(text, sentence.split(' ').length)
  return bag.some(s => jw(sentence, s) > threshold)
}

const getSimilarities = (sentence, text, threshold) => {
  if (!threshold) threshold = jaroThreshold
  const similarities = []
  const bag = bagOfSentences(text, sentence.split(' ').length)
  for (const b of bag) {
    if (jw(sentence, b) > threshold) similarities.push(b)
  }
  return similarities
}

module.exports = { jwIncludes, jwIncludesSentence, similar, getSimilarities }

/*
console.log(jw('sander', 'sande'))

test = ['karakterutskript', 'huhuhu', 'hihi', 'jada', 'tutut', 'jujujuju', 'sjørløver', 'og', 'sjøløver!']
test2 = ['karakterutskriptetne', 'huhuhu', 'hihi']

teststr = 'Dette er en tekst om de smale og gamle som ligger og sliter på teåppet til Ludde, den sniken av en snik, han burdde ikke spise fisk lenger'

console.log(jwIncludes('karakterutskrift', test2))
console.log(jwIncludesSentence('til Lusde, den', teststr))
*/
/*
const { schools } = require('../data/wordBook')
for (const school of schools) {
  for (const compSchool of schools) {
    if (jw(school, compSchool) > 0.9 && jw(school, compSchool) !== 1) console.log(`${school} === ${compSchool}, similarity: ${jw(school, compSchool)} \n`)
  }
}
console.log(jw('Sandefjord videregaende skole', 'Sandefjord videregående skole'))
*/