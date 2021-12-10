const { Quotes, Lines, Games, Users } = require("../models")
const { forceArray } = require("../util/force-array")

const { Op } = require("sequelize")

class SearchOptions {
  /**
   * Create a search options object
   *
   * Accepted options:
   *   speaker  String          Stringified snowflake of a discord user
   *   userId   Int|Array<Int>  One or more IDs for User objects
   *   gameId   Int|Array<Int>  One or more IDs for Game objects
   *   alias    String          Text to find within a speaker alias
   *   guild
   *
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
   */
  constructor(options = {}) {
    if (options.speaker) {
      this.speaker = options.speaker
    }

    if (options.userId) {
      this.userId = forceArray(options.userId)
    }

    if (options.gameId) {
      this.gameId = forceArray(options.gameId)
    }

    this.alias = options.alias

    this.guild = options.guild
  }

  build() {
    const quote_options = { where: {}, include: [] }
    const game_options = { model: Games, where: {}, required: true }
    const line_options = { model: Lines, where: {}, required: true }

    if (this.gameId) quote_options.where.gameId = this.gameId

    if (this.guild) game_options.where.guildId = this.guild.id

    if (this.speaker) {
      line_options.include = {
        model: Users,
        as: "speaker",
        required: true,
        where: {
          snowflake: this.speaker,
        },
      }
    }

    if (this.userId) line_options.where.speakerId = this.userId

    if (this.alias) {
      line_options.where.speakerAlias = { [Op.substring]: this.alias }
    }

    quote_options.include.push(game_options)
    quote_options.include.push(line_options)

    return quote_options
  }
}

/**
 * Find all quotes that match the given criteria
 * @param  {SearchOptions}  search_options      Search criteria object
 * @param  {Obj}            passthrough_options Object of options to send directly to Quotes.findAll(). Items
 *                                              in where and incliude will overwrite the generated clauses
 *                                              from search_options.
 * @return {Promise<Array<Quotes>>}             Promise resolveing to an array of Quote objects matching the criteria
 */
async function findAll(search_options, passthrough_options = {}) {
  const defaults = { order: [["saidAt", "DESC"]] }
  const options = search_options.build()

  const final = {
    ...defaults,
    ...options,
    ...passthrough_options,
  }

  return Quotes.findAll(final)
}

module.exports = {
  SearchOptions,
  findAll,
}
