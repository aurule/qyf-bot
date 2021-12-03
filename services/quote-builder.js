"use strict"

const { Quotes, Lines, Speakers } = require("../models")

module.exports = {
  /**
   * Create a new quote with a single line
   * @param  {string}       text          The content of the first line
   * @param  {string}       attribution   The name to use for the line's speakerAlias
   * @param  {Games}        game          Game object the quote is associated with
   * @param  {discord User} speaker_user  User object from discord of the user who said the quote
   * @return {Quotes}                     The created quote object
   */
  makeQuote: async (text, attribution, game, speaker_user) => {
    let speaker, _isNewSpeaker, quote
    try {
      [speaker, _isNewSpeaker] = await Speakers.findOrCreate({
        where: { snowflake: speaker_user.id.toString() },
        defaults: {
          name: speaker_user.username,
          snowflake: speaker_user.id.toString(),
        },
      })
      quote = await Quotes.create({
        gameId: game.id,
        saidAt: Date.now(),
      })
    } catch(error) {
      console.log(error)
    }

    await Lines.create({
      quoteId: quote.id,
      content: text,
      lineOrder: 0,
      speakerAlias: attribution,
      speakerId: speaker.id,
    })

    return quote
  },
}
