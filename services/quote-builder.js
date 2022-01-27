"use strict"

const { Quotes, Lines, Users } = require("../models")

class QuoteData {
  constructor({ text, attribution, speaker, context }) {
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

    /**
     * The context of the quote
     * @type string
     */
    this.context = context
  }
}

module.exports = {
  QuoteData,

  /**
   * Create a new quote with a single line
   * @param  {string}       text          The content of the first line
   * @param  {string}       attribution   The name to use for the line's speakerAlias
   * @param  {Games}        game          Game object the quote is associated with
   * @param  {discord User} speaker       User object from discord of the user who said the quote
   * @param  {discord User} quoter        User object from discord of the user who recorded the quote
   * @param  {string}       context       Description of the quote's circumstances
   * @return {Promise<Quotes>}            The created quote object with its line
   */
  makeQuote: async ({ text, attribution, game, speaker, quoter, context }) => {
    // create the quote
    const quote_attrs = {
      gameId: game.id,
      saidAt: Date.now(),
      context: context,
    }

    if (quoter) {
      const [quoter_user, _isNewQuoter] = await Users.findOrCreate({
        where: { snowflake: quoter.id.toString() },
        defaults: { name: quoter.username },
      })
      quote_attrs.quoterId = quoter_user.id
    }

    const the_quote = await Quotes.create(quote_attrs)

    // create the line
    const [speaker_user, _isNewSpeaker] = await Users.findOrCreate({
      where: { snowflake: speaker.id.toString() },
      defaults: { name: speaker.username },
    })

    await Lines.create({
      quoteId: the_quote.id,
      content: text,
      lineOrder: 0,
      speakerAlias: attribution,
      speakerId: speaker_user.id,
    })

    return the_quote.reload({ include: Lines })
  },

  /**
   * Add a line to an existing quote
   * @param  {String} options.text        Text of the quote
   * @param  {String} options.attribution The name to use for the line's speakerAlias
   * @param  {User} options.speaker       Discord user object from discord of the user who said the quote
   * @param  {Quotes} options.quote       Quote object the line should belong to
   * @return {Promise<Quotes>}            Quote object with its lines
   */
  addLine: async ({ text, attribution, speaker, quote }) => {
    const [speaker_user, _isNewSpeaker] = await Users.findOrCreate({
      where: { snowflake: speaker.id.toString() },
      defaults: { name: speaker.username },
    })

    const currentOrdinal = await Lines.max("lineOrder", {
      where: { quoteId: quote.id },
    })

    await quote.createLine({
      content: text,
      lineOrder: currentOrdinal + 1,
      speakerAlias: attribution,
      speakerId: speaker_user.id,
    })

    return quote.reload({ include: Lines })
  },
}
