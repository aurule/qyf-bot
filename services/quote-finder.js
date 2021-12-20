const { Quotes, Lines, Games, Users } = require("../models")
const { forceArray } = require("../util/force-array")

const { Op } = require("sequelize")
const { subMinutes } = require("date-fns")

/**
 * Class to represent complex quote search options
 *
 * This is meant to be passed to this module's findAll and findOne methods. Its
 * #build method creates a combined options object which can be used by
 * Sequelize to generate a query.
 */
class SearchOptions {
  /**
   * Create a search options object
   *
   * Accepted options:
   *   speaker  {String}          Stringified snowflake of a discord user
   *   userId   {Int|Array<Int>}  One or more IDs for User objects
   *   gameId   {Int|Array<Int>}  One or more IDs for Game objects
   *   alias    {String}          Text to find within a speaker alias
   *   guild    {Guilds}          Guild object
   *   text     {String}          Text to find within one or more line's contents
   *
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
   */
  constructor({ speaker, userId, gameId, alias, guild, text } = {}) {
    if (speaker) {
      this.speaker = speaker
    }
    if (userId) {
      this.userId = forceArray(userId)
    }
    if (gameId) {
      this.gameId = forceArray(gameId)
    }
    this.alias = alias
    this.guild = guild
    this.text = text
  }

  /**
   * Create an object describing query conditions for sequelize
   *
   * All criteria must be met for a qhote to be returned.
   *
   * @return {Object} An object encapsulating all of this object's search criteria
   */
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
    if (this.text) {
      line_options.where.content = { [Op.substring]: this.text }
    }

    quote_options.include.push(game_options)
    quote_options.include.push(line_options)

    return quote_options
  }
}

/**
 * Find all quotes that match the given criteria
 * @param  {SearchOptions}  search_options      Search criteria object
 * @param  {Object}         passthrough_options Object of options to send directly to Quotes.findAll(). Items
 *                                              in where and incliude will overwrite the generated clauses
 *                                              from search_options.
 * @return {Promise<Array<Quotes>>}             Promise resolving to an array of Quote objects matching the criteria
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

/**
 * Find one quote that matches the given criteria
 * @param  {SearchOptions}  search_options      Search criteria object
 * @param  {Object}         passthrough_options Object of options to send directly to Quotes.findOne(). Items
 *                                              in where and incliude will overwrite the generated clauses
 *                                              from search_options.
 * @return {Promise<Quotes>}                    Promise resolving to a Quote object matching the criteria
 */
async function findOne(search_options, passthrough_options = {}) {
  const defaults = {}
  const options = search_options.build()

  const final = {
    ...defaults,
    ...options,
    ...passthrough_options,
  }

  return Quotes.findOne(final)
}

/**
 * Find the most recent quote added by the given quoter within the last 15 minutes
 *
 * @param  {Users}  quoter              User whose quotes are searched
 * @param  {Object} passthrough_options Object of options to send directly to Quotes.findOne(). Items in where
 *                                      and incliude will overwrite the generated clauses.
 * @return {Promise<Quotes>}            Promise resolving to a Quote object matching the quoter.
 */
async function findLastEditable(quoter, passthrough_options = {}) {
  const options = {
    where: {
      updatedAt: {
        [Op.gte]: subMinutes(new Date(), 15),
      },
    },
    include: {
      model: Users,
      as: "quoter",
      required: true,
      where: {
        snowflake: quoter.id.toString(),
      },
    },
    order: [["updatedAt", "DESC"]],
  }

  return Quotes.findOne({
    ...options,
    ...passthrough_options,
  })
}

module.exports = {
  SearchOptions,
  findAll,
  findOne,
  findLastEditable,
}
