"use strict"

const { Quotes, Lines, Users } = require("../models")
const { logger } = require("../util/logger")

class QuoteData {
  constructor({ text, attribution, speaker }) {
    /**
     * The content of the quote
     * @type string
     */
    this.text = text

    /**
     * The name of who said it
     * @type string
     */
    this.attribution = attribution

    /**
     * The discord user for who said it. Only needs id and username attributes.
     * @type Object{id,username}
     */
    this.speaker = {
      id: speaker.id.toString(),
      username: speaker.username,
    }
  }
}

module.exports = {
  QuoteData,

  /**
   * Create a new quote with a single line
   * @param  {string}       text          The content of the first line
   * @param  {string}       attribution   The name to use for the line's speakerAlias
   * @param  {Games}        game          Game object the quote is associated with
   * @param  {discord User} speaker  User object from discord of the user who said the quote
   * @return {Quotes}                     The created quote object
   */
  makeQuote: async ({ text, attribution, game, speaker }) => {
    try {
      const the_quote = await Quotes.create({
        gameId: game.id,
        saidAt: Date.now(),
      })

      const [user, _isNewUser] = await Users.findOrCreate({
        where: { snowflake: speaker.id.toString() },
        defaults: {
          name: speaker.username,
          snowflake: speaker.id.toString(),
        },
      })

      await Lines.create({
        quoteId: the_quote.id,
        content: text,
        lineOrder: 0,
        speakerAlias: attribution,
        speakerId: user.id,
      })

      return the_quote
    } catch (error) {
      logger.warn(error)
      return null
    }
  },
}
