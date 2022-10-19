const { SlashCommandBuilder, userMention, underscore, MessageActionRow, MessageSelectMenu, Collection } = require("discord.js")
const { followup_store } = require("../util/keyv")
const { stripIndent, oneLine } = require("common-tags")

const { Guilds, Games } = require("../models")
const { determineName } = require("../services/speaker-name")
const { gameForChannel } = require("../services/default-game-scope")
const GameSelectTransformer = require("../transformers/game-select-transformer")
const { makeQuote, QuoteData } = require("../services/quote-builder")
const QuoteGameCompleter = require("../completers/quote-game-completer")
const { quoteReply } = require("../services/reply-builder")
const { memberOrAnonymous } = require("../services/member-injector")
const { getReplyFn } = require("../util/getReplyFn")

/**
 * Get the correct game for the quote
 *
 * Uses the game provided in args first, then tries the current default, then
 * falls back on prompting the user.
 *
 * @param  {string}       game_arg    Game name from command arguments
 * @param  {Guilds}       guild       Guild the game is from
 * @param  {Interaction}  interaction Discord interaction object for the command
 * @return {Promise<Games|null>}      The correct game, or null if the prompt timed out
 */
async function getGame(game_arg, guild, interaction) {
  let game = null
  if (game_arg) {
    const gameResult = await guild.getGamesByPartialName(game_arg)
    if (gameResult.length) {
      game = gameResult[0]
    }
  }

  if (!game) {
    game = await gameForChannel(interaction.channel)
  }

  // use the version from module.exports so we can mock it in tests
  return game || module.exports.promptForGame(interaction, guild)
}

/**
 * Prompt the user to pick a game
 *
 * @param  {Interaction}  interaction Discord interaction object for the command
 * @param  {Guilds}       guild       Guild the game is from
 * @return {Promise<Games|null>}      The chosen game, or null if the prompt timed out
 */
async function promptForGame(interaction, guild) {
  const gameSelectRow = new MessageActionRow().addComponents(
    new MessageSelectMenu()
      .setCustomId("newQuoteGameSelect")
      .setPlaceholder("Pick a game")
      .addOptions(GameSelectTransformer.transform(guild.Games))
  )

  const gameSelectMessage = await interaction.reply({
    content: "Which game is this quote from?",
    components: [gameSelectRow],
    ephemeral: true,
    fetchReply: true,
  })
  const filter = (i) => {
    i.deferUpdate()
    return i.user.id === interaction.user.id
  }
  return gameSelectMessage.awaitMessageComponent({ filter, componentType: 'SELECT_MENU', time: 60000 })
    .then(async (i) => {
      const game = await Games.findByPk(i.values[0])
      await interaction.editReply({ content: `Saving your quote to ${game.name}...`, components: [] })
      return game
    })
    .catch(async (err) => {
      if(err.code == 'INTERACTION_COLLECTOR_ERROR') {
        await interaction.editReply({ content: "You didn't pick a game, so I could not save the quote!", components: [] })
        return null
      } else {
        throw err
      }
    })
}

module.exports = {
  name: "quote",
  description: "Record a quote!",
  data: () =>
    new SlashCommandBuilder()
      .setName(module.exports.name)
      .setDescription(module.exports.description)
      .addStringOption((option) =>
        option.setName("text").setDescription("What was said").setRequired(true)
      )
      .addUserOption((option) =>
        option
          .setName("speaker")
          .setDescription("The user who said the thing")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("alias")
          .setDescription(
            "The name of who said it. Replaces the speaker's current nickname."
          )
      )
      .addStringOption((option) =>
        option
          .setName("context")
          .setDescription(
            "A few words that describe circumstances of the quote"
          )
      )
      .addStringOption((option) =>
        option
          .setName("game")
          .setDescription("Pick a game other than the current default")
          .setAutocomplete(true)
      ),
  autocomplete: new Collection([
    ['game', QuoteGameCompleter]
  ]),
  promptForGame,
  getGame,
  async execute(interaction) {
    const text = interaction.options.getString("text")
    const speaker = interaction.options.getUser("speaker")
    const alias = interaction.options.getString("alias")
    const context = interaction.options.getString("context")
    const user = interaction.user
    const game_arg = interaction.options.getString("game")

    const speaker_member = await memberOrAnonymous(interaction.guild, speaker)
    const speaker_name = determineName({
      nickname: speaker_member.nickname,
      username: speaker_member.user.username,
      alias: alias,
    })

    const guild = await Guilds.findByInteraction(interaction, {
      include: Games,
    })

    // get the game from args, from the current default, or from a prompt
    const game = await module.exports.getGame(game_arg, guild, interaction) // using module.exports so we can mock this out in tests
    if(!game) return

    // Save the quote
    return makeQuote({
      text: text,
      attribution: speaker_name,
      game: game,
      speaker: speaker_member.user,
      quoter: user,
      context: context,
    })
      .then(async (result) => {
        const fn = getReplyFn(interaction)
        return interaction[fn](
          quoteReply({
            reporter: user,
            speaker: speaker_member.user,
            alias: alias,
            text: text
          })
        )
      })
      .catch((error) => {
        throw(error)
      })

  },
  help({ command_name }) {
    return [
      oneLine`
        ${command_name} records a new quote for the channel's (or server's) default game. If the current
        channel or server doesn't have a default game set, ${command_name} will prompt you to pick which game
        the quote is from.
      `,
      "",
      stripIndent`
        Args:
            \`text\`: (required) The text of the quote
            \`speaker\`: (required) The user who said it.
            \`alias\`: The name to use for the speaker, in case their nickname doesn't match their character, etc.
            \`context\`: A few words about what's going on to help the quote make sense
            \`game\`: The game this quote is for, in case the default game isn't right
      `,
      "",
      oneLine`
        The given \`text\` will be recorded as a new quote. If you give an \`alias\`, that will be used for the
        attribution. If you don't, then ${command_name} will use the \`speaker\`'s server nickname (if set) or
        their Discord username.
      `,
      "",
      oneLine`
        To record a quote from someone who isn't on Discord, or from an anonymous source, use the
        ${userMention(process.env.CLIENT_ID)} user as the speaker.
      `,
      "",
      `For more info on how default games work, check out the ${underscore("Default Games")} topic in \`/qyf-help\`.`
    ].join("\n")
  },
}
