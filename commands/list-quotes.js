const { SlashCommandBuilder, userMention, underscore } = require("@discordjs/builders")
const { stripIndent, oneLine } = require("common-tags")
const { Collection } = require("discord.js")

const { Guilds, Games, Users } = require("../models")
const GameChoicesTransformer = require("../transformers/game-choices-transformer")
const QuoteFinder = require("../services/quote-finder")
const { clamp } = require("../util/clamp")
const QuotePresenter = require("../presenters/quote-presenter")
const { gameForChannel } = require("../services/default-game-scope")
const GameNameWithAllCompleter = require("../completers/game-name-with-all-completer")

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

  if (game_arg == GameNameWithAllCompleter.ALL_GAMES) return null_game

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
  data: () =>
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
      .addStringOption((option) =>
        option
          .setName("game")
          .setDescription(
            "Game the quote is from. Defaults to channel's current game"
          )
          .setAutocomplete(true)
      )
      .addIntegerOption((option) =>
        option
          .setName("amount")
          .setDescription(`Number of quotes to show (1-${MAX_LIMIT})`)
          .setMinValue(1)
          .setMaxValue(MAX_LIMIT)
      ),
  autocomplete: new Collection([
    ['game', GameNameWithAllCompleter]
  ]),
  async execute(interaction) {
    const speaker = interaction.options.getUser("speaker")
    const alias = interaction.options.getString("alias")
    const text = interaction.options.getString("text")
    const game_arg = Number(interaction.options.getString("game"))
    const amount = interaction.options.getInteger("amount")

    const guild = await Guilds.findByInteraction(interaction)

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
    const quote_contents = QuotePresenter.present(quotes)

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
  help({ command_name }) {
    return [
      oneLine`
        ${command_name} shows the most recent quotes recorded on this server. It searches for quotes based on
        the arguments given, and displays the most recent ones for your entertainment.
      `,
      "",
      stripIndent`
        Args:
            \`speaker\`: User who said one or more lines
            \`alias\`: One or more lines are attributed to this name
            \`text\`: One or more lines contain this text
            \`game\`: Show quotes from a game other than the channel's default
            \`amount\`: Number of quotes from 1-${MAX_LIMIT}. Defaults to ${DEFAULT_LIMIT}
      `,
      "",
      oneLine`
        ${command_name} finds quotes which match *all* of the options given. It can only display the first
        few, however, due to restrictions on message length set by Discord. Listing long quotes might still
        prevent a response from being posted thanks to these restrictions, so lower the \`amount\` if this
        happens.
      `,
      "",
      oneLine`
        Quotes are pulled from the channel's default game, or from all games if no default is set. For more
        info on how default games work, check out the ${underscore("Default Games")} topic in \`/qyf-help\`.
      `,
    ].join("\n")
  },
}
