const { ContextMenuCommandBuilder } = require("@discordjs/builders")
const { ApplicationCommandType } = require("discord-api-types/v9")

const { MessageActionRow, MessageSelectMenu } = require("discord.js")
const { keyv } = require("../util/keyv")

const { Guilds, Games } = require("../models")
const { determineName } = require("../services/speaker-name")
const { gameForChannel } = require("../services/default-game-scope")
const GameSelectTransformer = require("../transformers/game-select-transformer")
const { makeQuote, QuoteData } = require("../services/quote-builder")

module.exports = {
  name: "Quote Message",
  data: (guild) =>
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
            `${user.username} quoted ${speaker_name}: ${text}`
          )
        })
        .catch((error) => {
          return interaction.reply("Something went wrong :-(")
        })
    }

    // With no default game, we need a followup to pick the right game
    keyv.set(
      interaction.id.toString(),
      new QuoteData({
        text: text,
        attribution: speaker_name,
        speaker: speaker,
      })
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
}
