const { wordBook, except, schools } = require('../data/wordBook')
const { getSimilarities } = require('./jaroWinkler')

module.exports = (text) => {
  let result = text
  const strippedText = text
  for (const word of wordBook) {
    const similarities = getSimilarities(word, strippedText, 0.92)
    for (const similarity of similarities) {
      if (except.includes(similarity)) continue
      if (word.charAt(word.length - 1) === ':' && similarity.charAt(similarity.length - 1) !== ':') continue
      result = result.replace(similarity, word)
    }
  }
  for (const word of schools) {
    const similarities = getSimilarities(word, strippedText, 0.96)
    for (const similarity of similarities) {
      if (except.includes(similarity)) continue
      if (word.charAt(word.length - 1) === ':' && similarity.charAt(similarity.length - 1) !== ':') continue
      result = result.replace(similarity, word)
    }
  }
  return result
}
