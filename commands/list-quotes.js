const { SlashCommandBuilder, userMention } = require("@discordjs/builders")

const {
  Guilds,
  Games,
  Quotes,
  Lines,
  DefaultGames,
  Users,
} = require("../models")
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
  if (game_arg) {
    game = await Games.findByPk(game_arg)
  } else {
    game = await gameForChannel(channel)
  }

  return game || null_game
}

/**
 * Build a string that represents the filters and options to the command
 * @param  {Int}              total           Total quotes found
 * @param  {Games}            game            The game object the qutoes are from
 * @param  {String}           quote_contents  The quotes themselves, already formatted
 * @param  {String|null}      options.alias   The alias used to find quotes
 * @param  {DiscordUser|null} options.speaker The speaker object used to find quotes
 * @param  {String|null}      options.text    The text searched for in the quotes
 * @return {String}                           The final human-readable output
 */
function describeResults(
  total,
  game,
  quote_contents,
  { alias, speaker, text } = {}
) {
  const desc_lines = []

  if (total) {
    desc_lines.push("Showing the")
  } else {
    desc_lines.push("No quotes found")
  }

  if (total > 1) {
    desc_lines.push(`${total} most recent quotes`)
  } else if (total == 1) {
    desc_lines.push(`most recent quote`)
  }

  desc_lines.push(`from ${game.name}`)

  if (alias) {
    desc_lines.push("by")
    if (speaker) desc_lines.push(`${userMention(speaker.id)} as`)
    desc_lines.push(`${alias}`)
  } else if (speaker) desc_lines.push(`by ${userMention(speaker.id)}`)

  if (text) desc_lines.push(`including "${text}"`)

  const description = desc_lines.join(" ")

  if (total) {
    return `${description}:\n\n${quote_contents}`
  } else {
    return description
  }
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

    // This section is a workaround for a bug in sequelize that causes a SQL
    // error we pass a snowflake to the quote finder. For a summary, see
    // services/quote-finder.test.js near the bottom.
    //
    // To avoid that bug, we make a separate query for the user and manually
    // handle the not-found case before passing the user ID to the finder.
    let speaker_user = {}
    if (speaker) {
      const user = await Users.findOne({
        where: { snowflake: speaker.id.toString() },
      })
      if (!user) {
        return interaction.reply(
          describeResults(0, game, "", {
            alias: alias,
            speaker: speaker,
            text: text,
          })
        )
      }
      speaker_user = user
    }

    const finder_options = new QuoteFinder.SearchOptions({
      userId: speaker_user.id,
      alias: alias,
      gameId: game.id,
      text: text,
      guild: guild,
    })
    const quotes = await QuoteFinder.findAll(finder_options, { limit: limit })
    const quote_contents = QuoteSnippetTransformer.transform(quotes)

    return interaction.reply(
      describeResults(quotes.length, game, quote_contents, {
        alias: alias,
        speaker: speaker,
        text: text,
      })
    )
  },
  getGameOrDefault,
  describeResults,
}
