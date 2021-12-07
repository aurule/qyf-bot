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

    /**
     * How many quotes to show
     * @type {Number}
     */
    this.limit = options.limit
  }
}

/**
 * Find all quotes that match the given criteria
 * @param  {Options}        options Search criteria and limit object
 * @return {Array<Quotes>}          Array of Quote objects matching the criteria
 */
async function findAll(options, query_options = {}) {
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
  Options,
  findAll,
}
