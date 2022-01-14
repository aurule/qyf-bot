const { ContextMenuCommandBuilder, underscore } = require("@discordjs/builders")
const { ApplicationCommandType } = require("discord-api-types/v9")
const { MessageActionRow, MessageSelectMenu } = require("discord.js")
const { stripIndent, oneLine } = require("common-tags")

const { followup_store } = require("../util/keyv")
const { Guilds, Games } = require("../models")
const { determineName } = require("../services/speaker-name")
const { gameForChannel } = require("../services/default-game-scope")
const GameSelectTransformer = require("../transformers/game-select-transformer")
const { makeQuote, QuoteData } = require("../services/quote-builder")
const { quoteReply } = require("../services/reply-builder")

module.exports = {
  name: "Quote Message",
  type: "menu",
  data: () =>
    new ContextMenuCommandBuilder()
      .setName("Quote Message")
      .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    const message = await interaction.channel.messages.fetch(
      interaction.targetId
    )
    const text = message.content
    const speaker = message.author
    const user = interaction.user

    const speaker_member = await interaction.guild.members.fetch(speaker)
    const speaker_name = determineName({
      username: speaker.username,
      nickname: speaker_member.nickname,
      alias: null,
    })
    const game = await gameForChannel(interaction.channel)

    // With a default game, we can save immediately
    if (game) {
      return makeQuote({
        text: text,
        attribution: speaker_name,
        game: game,
        speaker: speaker,
      })
        .then((result) => {
          return interaction.reply(
            quoteReply({
              reporter: user,
              speaker: speaker,
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
        speaker: speaker,
      }),
      900000 // expire in 15 minutes
    )

    const guild = await Guilds.findByInteraction(interaction, {
      include: Games,
    })
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
        ${command_name} is a context menu command that records a Discord message as a new quote for the channel's (or server's) default game. If the current
        channel or server doesn't have a default game set, ${command_name} will prompt you to pick which game
        the quote is from. Discord only makes context menu commands available to desktop users. To use
        ${command_name}, right click on a message, then hover over *Apps*, then click ${command_name} in the
        small menu that appears.
      `,
      "",
      oneLine`
        The message's contents will be added as the first line of a new quote. The user who sent the message
        will be the line's speaker and their server nickname (if set) or Discord username will be used as the
        line's attribution.
      `,
      "",
      `For more info on how default games work, check out the ${underscore("Default Games")} topic in \`/qyf-help\`.`
    ].join("\n")
  },
}
