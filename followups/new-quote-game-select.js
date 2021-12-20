const { Quotes, Games } = require("../models")
const { makeQuote } = require("../services/quote-builder")
const { keyv } = require("../util/keyv.js")

module.exports = {
  name: "newQuoteGameSelect",
  async execute(interaction) {
    const game = await Games.findByPk(interaction.values[0])
    interaction.update({ content: `Chose ${game.name}`, components: [] })

    options = await keyv.get(interaction.message.interaction.id.toString())

    return makeQuote({
      text: options.text,
      attribution: options.attribution,
      game: game,
      speaker: options.speaker,
    })
      .then((result) => {
        return interaction.followUp(
          `${interaction.user.username} quoted ${options.attribution}: ${options.text}`
        )
      })
      .catch((error) => {
        return interaction.followUp("Something went wrong :-(")
      })
  },
}
