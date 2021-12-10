const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageActionRow, MessageSelectMenu } = require("discord.js")
const { keyv } = require("../util/keyv")

const { Guilds, Games, Quotes, Lines } = require("../models")
const { determineName } = require("../services/speaker-name")
const { gameForChannel } = require("../services/default-game-scope")
const GameSelectTransformer = require("../transformers/game-select-transformer")
const { makeQuote, QuoteData } = require("../services/quote-builder")

module.exports = {
  name: "quote",
  data: (guild) =>
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
      ),
  async execute(interaction) {
    const text = interaction.options.getString("text")
    const speaker_user = interaction.options.getUser("speaker")
    const alias = interaction.options.getString("alias")
    const user = interaction.user

    const speaker_name = determineName({
      username: interaction.guild.members.fetch(speaker_user).nickname,
      nickname: speaker_user.username,
      alias: alias,
    })
    const game = await gameForChannel(interaction.channel)

    if (game) {
      const result = await makeQuote({
        text: text,
        attribution: speaker_name,
        game: game,
        speaker_user: speaker_user,
      })
      if (result instanceof Quotes) {
        return interaction.reply(
          `${user.username} quoted ${speaker_name}: ${text}`
        )
      } else {
        return interaction.reply("Something went wrong :-(")
      }
    }

    keyv.set(
      interaction.id.toString(),
      new QuoteData({
        text: text,
        attribution: speaker_name,
        speaker_user: speaker_user,
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
