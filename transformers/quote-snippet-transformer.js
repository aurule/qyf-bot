const { forceArray } = require("../util/force-array")

/**
 * Return a formatted snippet that displays the passed quotes' lines
 *
 * The format renders like:
 *
 * > **attribution:** line 0 text
 * > **att:* line 1 text
 *
 * > **att:** line 0 text quote 2
 *
 * @param  {Array<Quotes>} quotes Array of quote objects with Lines included
 * @return {String}               Markdown-formatted string of the quotes' contents
 */
function transform(quotes) {
  quotes = forceArray(quotes)

  return quotes
    .map((quote) => {
      return quote.Lines.map((line) => {
        return `> **${line.speakerAlias}:** ${line.content}`
      }).join("\n")
    })
    .join("\n\n")
}

module.exports = {
  transform,
}
