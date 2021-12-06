const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { keyv } = require("../util/keyv")

const { determineName } = require("../services/speaker-name")
const { gameForChannel } = require("../services/default-game-scope")
const { Quotes, Lines, Speakers } = require("../models")
const { logger } = require("../util/logger")
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

    const speaker_name = determineName(
      interaction.guild.members.fetch(speaker_user).nickname,
      speaker_user.username,
      alias
    )
    const game = await gameForChannel(interaction.channel)

    if (game) {
      const result = await makeQuote(text, speaker_name, game, speaker_user)
      if(result instanceof Quotes) {
        return interaction.reply(`${user.name} quoted ${speaker_name}: ${text}`)
      } else {
        return interaction.reply("Something went wrong :-(")
      }
    }

    keyv.set(
      interaction.id,
      new QuoteData({
        text: text,
        attribution: speaker_name,
        speaker_user: speaker_user,
      })
    )

    const guild = Guilds.findByInteraction(interaction)
    const games = Games.findAll({where: {guildId: guild.id}})
    const gameSelectRow = new MessageActionRow()
      .addComponents(
        new MessageSelectMenu()
          .setCustomId("newQuoteGameSelect")
          .setPlaceholder("Pick a game")
          .addOptions(GameSelectTransformer.transform(games))
      )

    return interaction.reply({content: "Which game is this quote from?", components: [gameSelectRow], ephemeral: true})
  },
}
