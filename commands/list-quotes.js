const { SlashCommandBuilder } = require("@discordjs/builders")

const { Guilds, Games, Quotes, Lines, DefaultGames } = require("../models")
const GameChoicesTransformer = require("../transformers/game-choices-transformer")
const QuoteFinder = require("../services/quote-finder")
const { clamp } = require("../util/clamp")
const QuoteSnippetTransformer = require("../transformers/quote-snippet-transformer")

/**
 * Maximum number of quotes that can be displayed
 * @type {Number}
 */
const MAX_LIMIT = 10

/**
 * Default number of quotes to display
 * @type {Number}
 */
const DEFAULT_LIMIT = 5

module.exports = {
  name: "list-quotes",
  data: (guild) =>
    new SlashCommandBuilder()
      .setName("list-quotes")
      .setDescription("Show the most recent quotes from the current game")
      .addUserOption((option) =>
        option.setName("speaker").setDescription("By a user")
      )
      .addStringOption((option) =>
        option.setName("alias").setDescription("By a name")
      )
      .addStringOption((option) =>
        option.setName("text").setDescription("Containing some text")
      )
      .addIntegerOption((option) =>
        option
          .setName("game")
          .setDescription(
            "Game the quote is from. Defaults to channel's current game"
          )
          .addChoices(GameChoicesTransformer.transform(guild.Games))
      )
      .addIntegerOption((option) =>
        option
          .setName("amount")
          .setDescription("Number of quotes to show (1-10)")
      ),
  async execute(interaction) {
    const speaker = interaction.options.getUser("speaker")
    const alias = interaction.options.getString("alias")
    const text = interaction.options.getString("text")
    const game_id = interaction.options.getInteger("game")
    const amount = interaction.options.getInteger("amount")

    const limit = amount ? clamp(amount, 1, MAX_LIMIT) : DEFAULT_LIMIT

    const guild = await Guilds.findByInteraction(interaction, {
      include: Games,
    })

    const finder_options = new QuoteFinder.Options({
      limit: limit,
      speaker: speaker,
      alias: alias,
      gameId: game_id,
      text: text,
      guild: guild,
    })
    const quotes = await QuoteFinder.findAll(finder_options, { include: Lines })
    const reply_text = QuoteSnippetTransformer.transform(quotes)

    return interaction.reply(reply_text)
  },
}
