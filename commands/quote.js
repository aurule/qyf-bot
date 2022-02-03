const { SlashCommandBuilder, userMention, underscore } = require("@discordjs/builders")
const { MessageActionRow, MessageSelectMenu } = require("discord.js")
const { followup_store } = require("../util/keyv")
const { stripIndent, oneLine } = require("common-tags")
const { Collection } = require("discord.js")

const { Guilds, Games } = require("../models")
const { determineName } = require("../services/speaker-name")
const { gameForChannel } = require("../services/default-game-scope")
const GameSelectTransformer = require("../transformers/game-select-transformer")
const { makeQuote, QuoteData } = require("../services/quote-builder")
const QuoteGameCompleter = require("../completers/quote-game-completer")
const { quoteReply } = require("../services/reply-builder")
const { memberOrAnonymous } = require("../services/member-injector")

module.exports = {
  name: "quote",
  data: () =>
    new SlashCommandBuilder()
      .setName("quote")
      .setDescription("Record a quote!")
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

    let game
    if (game_arg) {
      game = await Games.findOne({ where: { name: game_arg, guildId: guild.id } })
    } else {
      game = await gameForChannel(interaction.channel)
    }

    // With a default game, we can save immediately
    if (game) {
      return makeQuote({
        text: text,
        attribution: speaker_name,
        game: game,
        speaker: speaker_member.user,
        quoter: user,
        context: context,
      })
        .then(async (result) => {
          return interaction.reply(
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
    }

    // With no default game, we need a followup to pick the right game
    followup_store.set(
      interaction.id.toString(),
      new QuoteData({
        text: text,
        attribution: speaker_name,
        speaker: speaker_member.user,
        context: context,
      })
    )

    const gameSelectRow = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("newQuoteGameSelect")
        .setPlaceholder("Pick a game")
        .addOptions(GameSelectTransformer.transform(guild.Games))
    )

    return interaction.reply({
      content: "Which game is this quote from?",
      components: [gameSelectRow],
      ephemeral: true,
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
