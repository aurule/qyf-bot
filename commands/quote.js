const { SlashCommandBuilder } = require("@discordjs/builders")

const { determineName } = require("../services/speaker-name")
const { gameForChannel } = require("../services/default-game-scope")
const { Quotes, Lines, Speakers } = require("../models")
const { makeQuote } = require("../services/quote-builder")
const { logger } = require("../util/logger")

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

    // if no default game, store quote info and prompt for game
    //    that followup will need to retrieve the stored info, save for game, post a message, and ask if it should save the chosen game as the default for this channel
    //    the followup after that either saves the game as default or scraps it, replies either way

    return interaction.reply(`The quote: "${text}" ~ ${speaker_name}`)
  },
}
