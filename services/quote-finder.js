const { Quotes, Lines } = require("../models")

class Options {
  constructor(options) {
    // translate discord speaker to User object
    this.speaker = options.speaker

    // accept either a number or an array of numbers
    this.gameId = options.gameId

    /**
     * Displayed attribution of at least one line
     * @type {String}
     */
    this.alias = options.alias

    /**
     * Guild containing the quotes
     * @type {Guild}
     */
    this.guild = options.guild
  }
}

/**
 * Find all quotes that match the given criteria
 * @param  {SearchOptions}  search_options  Search criteria
 * @return {Array<Quotes>}                  Array of Quote objects matching the criteria
 */
async function findAll(search_options, query_options = {}) {
  // build a query
  //

  // const game_ids = guild.Games.map((g) => g.id)
  // const quotes = await Quotes.findAll({
  //   where: { gameId: game_ids },
  //   include: Lines,
  //   limit: amount,
  //   order: [['saidAt', 'DESC']],
  // })
  return Quotes.findAll(query_options)
}

module.exports = {
  SearchOptions,
  findAll,
}
