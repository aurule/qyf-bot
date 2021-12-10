const { Quotes, Games } = require("../models")
const { makeQuote } = require("../services/quote-builder")
const { keyv } = require("../util/keyv.js")

module.exports = {
  name: "newQuoteGameSelect",
  async execute(interaction) {
    const game = await Games.findByPk(interaction.values[0])
    interaction.update({ content: `Chose ${game.name}`, components: [] })

    options = await keyv.get(interaction.message.interaction.id.toString())

    const result = await makeQuote({
      text: options.text,
      attribution: options.attribution,
      game: game,
      speaker: options.speaker,
    })

    if (!(result instanceof Quotes)) {
      return interaction.followUp("Something went wrong :-(")
    }
    return interaction.followUp(
      `${interaction.user.username} quoted ${options.attribution}: ${options.text}`
    )
  },
}
