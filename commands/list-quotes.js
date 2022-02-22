const {
  SlashCommandBuilder,
  userMention,
  underscore,
} = require("@discordjs/builders")
const { stripIndent, oneLine } = require("common-tags")
const { Collection, MessageActionRow, MessageButton } = require("discord.js")

const { Guilds, Games, Users } = require("../models")
const GameChoicesTransformer = require("../transformers/game-choices-transformer")
const QuoteFinder = require("../services/quote-finder")
const { clamp } = require("../util/clamp")
const QuotePresenter = require("../presenters/quote-presenter")
const { gameForChannel } = require("../services/default-game-scope")
const QuoteListGameCompleter = require("../completers/quote-list-game-completer")

/**
 * Total number of quotes to show at a time
 * @type {Number}
 */
const PAGE_SIZE = 5

/**
 * Delay before controls are removed. Five minutes.
 * @type {Number}
 */
const PAGINATION_TIMEOUT = 300000

/**
 * Get the correct game or fall back on default data
 *
 * If gameName is provided, it will look up that game and ignore the default.
 * If it is not provided and there is a default, it will return the default.
 * If it is not provided and there is no default, it will return a null object:
 * {
 *    id: null,
 *    name: "all games",
 *  }
 *
 * @param  {String}   gameName  Name of the game to use
 * @param  {Channel}  channel   Discord channel object to use for finding a default
 * @param  {Int}      guildId   ID of the guild for the game
 * @return {Game}               Game object or truncated lookalike with id and name properties
 */
async function getGameOrDefault(gameName, channel, guildId) {
  let null_game = {
    id: null,
    name: "all games",
  }

  if (gameName == QuoteListGameCompleter.ALL_GAMES) return null_game

  var game
  if (gameName) {
    game = await Games.findOne({ where: { name: gameName, guildId: guildId } })
  } else {
    game = await gameForChannel(channel)
  }

  return game || null_game
}

/**
 * Build a string that represents the filters and options to the command
 * @param  {Int}              pageNum         Which page we're on
 * @param  {Int}              total           Total quotes found
 * @param  {Games}            game            The game object the qutoes are from
 * @param  {String}           quote_contents  The quotes themselves, already formatted
 * @param  {String|null}      options.alias   The alias used to find quotes
 * @param  {DiscordUser|null} options.speaker The speaker object used to find quotes
 * @param  {String|null}      options.text    The text searched for in the quotes
 * @return {String}                           The final human-readable output
 */
function describeResults(
  pageNum,
  total,
  game,
  quote_contents,
  { alias, speaker, text } = {}
) {
  const desc_lines = []

  if (total) {
    desc_lines.push(
      `Showing page ${pageNum} of ${Math.ceil(total / PAGE_SIZE)}`
    )
  } else {
    desc_lines.push("No quotes found")
  }

  desc_lines.push(`of quotes from ${game.name}`)

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

/**
 * Construct the pagination controls
 *
 * Right now, this is a back and next button pair. They are disabled
 * on the first and last page, respectively, and are not shown when
 * there is only one page of quotes.
 *
 * @param  {Int}              pageNum Which page we're on
 * @param  {Int}              total   Total count of matching quotes
 * @return {Array[Component]}         Array of pagination controls
 */
function paginationControls(pageNum, total) {
  if (total <= PAGE_SIZE) return []

  const actions = new MessageActionRow().addComponents(
    new MessageButton()
      .setCustomId("paginateBack")
      .setLabel("Back")
      .setStyle("SECONDARY")
      .setDisabled(pageNum == 1),
    new MessageButton()
      .setCustomId("paginateNext")
      .setLabel("Next")
      .setStyle("SECONDARY")
      .setDisabled(pageNum * PAGE_SIZE >= total)
  )

  return [actions]
}

/**
 * [Get the quotes for a given page]
 *
 * @param  {Int}            pageNum         Which page we're on
 * @param  {SearchOptions}  finder_options  Options for the quote finder
 * @return {Promise}                        Results object with data in .rows and total in .count
 */
function getPageResults(pageNum, finder_options) {
  return QuoteFinder.findAndCountAll(finder_options, {
    limit: PAGE_SIZE,
    offset: (pageNum - 1) * PAGE_SIZE,
  })
}

/**
 * Construct the reply data for a full page of quote results
 *
 * @param  {Int}              pageNum         Which page we're on
 * @param  {SearchOptions}    finder_options  Options for the quote finder
 * @param  {Games}            game            The game object the qutoes are from
 * @param  {String|null}      alias           The alias used to find quotes
 * @param  {DiscordUser|null} speaker         The speaker object used to find quotes
 * @param  {String|null}      text            The text searched for in the quotes
 * @return {Object}                           Message data object with content and components attributes
 */
async function buildPageContents(
  pageNum,
  finder_options,
  game,
  alias,
  speaker,
  text
) {
  const result = await getPageResults(pageNum, finder_options)
  const quote_contents = QuotePresenter.present(result.rows)
  const content = describeResults(pageNum, result.count, game, quote_contents, {
    alias: alias,
    speaker: speaker,
    text: text,
  })

  return {
    content: content,
    components: paginationControls(pageNum, result.count),
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
      ),
  autocomplete: new Collection([["game", QuoteListGameCompleter]]),
  async execute(interaction) {
    const speaker = interaction.options.getUser("speaker")
    const alias = interaction.options.getString("alias")
    const text = interaction.options.getString("text")
    const game_arg = interaction.options.getString("game")

    const guild = await Guilds.findByInteraction(interaction)

    const game = await getGameOrDefault(game_arg, interaction.channel, guild.id)

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
          describeResults(1, 0, game, "", {
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

    let pageNum = 1

    let content = await buildPageContents(
      pageNum,
      finder_options,
      game,
      alias,
      speaker,
      text
    )
    const replyMessage = await interaction.reply({
      ...content,
      fetchReply: true,
    })

    const paginationCollector = replyMessage.createMessageComponentCollector({
      componentType: "BUTTON",
      time: PAGINATION_TIMEOUT,
    })
    paginationCollector.on("collect", async (i) => {
      if (i.customId == "paginateNext") pageNum++
      if (i.customId == "paginateBack") pageNum--

      content = await buildPageContents(
        pageNum,
        finder_options,
        game,
        alias,
        speaker,
        text
      )
      await i.update(content)
    })
    paginationCollector.on("end", async (collected) => {
      await interaction.editReply({ components: [] })
    })

    return replyMessage
  },
  getGameOrDefault,
  describeResults,
  paginationControls,
  buildPageContents,
  getPageResults,
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
      `,
      "",
      oneLine`
        ${command_name} finds quotes which match *all* of the options given. It can only display a few on each
        page, due to restrictions on message length set by Discord, so use the Next and Back buttons to see
        more. The buttons remain active for ${
          PAGINATION_TIMEOUT / 60000
        } minutes.
      `,
      "",
      oneLine`
        Quotes are pulled from the channel's default game, or from all games if no default is set. For more
        info on how default games work, check out the ${underscore(
          "Default Games"
        )} topic in \`/qyf-help\`.
      `,
    ].join("\n")
  },
}
