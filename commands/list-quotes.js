const { SlashCommandBuilder } = require("@discordjs/builders")

const { Guilds, Games, Quotes, Lines, DefaultGames } = require("../models")
const GameChoicesTransformer = require("../transformers/game-choices-transformer")
const QuoteFinder = require("../services/quote-finder")
const { clamp } = require("../util/clamp")
const QuoteSnippetTransformer = require("../transformers/quote-snippet-transformer")
const { gameForChannel } = require("../services/default-game-scope")

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

/**
 * Get the correct game or fall back on default data
 *
 * If game_arg is provided, it will look up that game and ignore the default.
 * If it is not provided and there is a default, it will return the default.
 * If it is not provided and there is no default, it will return a null object:
 * {
 *    id: null,
 *    name: "all games",
 *  }
 *
 * @param  {Int}      game_arg  ID of the game to use
 * @param  {Channel}  channel   Discord channel object to use for finding a default
 * @return {Game}               Game object or truncated lookalike with id and name properties
 */
async function getGameOrDefault(game_arg, channel) {
  let null_game = {
    id: null,
    name: "all games",
  }

  var game
  if(game_arg) {
    game = await Games.findByPk(game_arg)
  } else {
    game = await gameForChannel(channel)
  }

  return game || null_game
}

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
    const game_arg = interaction.options.getInteger("game")
    const amount = interaction.options.getInteger("amount")

    const guild = await Guilds.findByInteraction(interaction, {
      include: Games,
    })

    // enforce min and max number of quotes
    const limit = amount ? clamp(amount, 1, MAX_LIMIT) : DEFAULT_LIMIT

    const game = await getGameOrDefault(game_arg, interaction.channel)

    const finder_options = new QuoteFinder.SearchOptions({
      speaker: speaker,
      alias: alias,
      gameId: game.id,
      text: text,
      guild: guild,
    })
    const quotes = await QuoteFinder.findAll(finder_options, { include: Lines, limit: limit })
    const quote_text = QuoteSnippetTransformer.transform(quotes)

    return interaction.reply(`Showing the ${limit} most recent quotes from ${game.name}:\n\n${quote_text}`)
  },
  getGameOrDefault,
}
