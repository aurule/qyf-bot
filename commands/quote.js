const { SlashCommandBuilder } = require("@discordjs/builders")

const { determineName } = require("../services/speaker-name")
const { gameForChannel } = require("../services/default-game-scope")

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
    const speaker = interaction.options.getUser("speaker")
    const alias = interaction.options.getString("alias")

    const speaker_name = determineName(interaction.guild.members.fetch(speaker).nickname, speaker.username, alias)
    const game = gameForChannel(interaction.channel)

    // get default game for current scope (channel, channel parent, possibly channel parent parent, guild)
    //    offload to scope service
    // if default game, save quote and reply
    // if no default game, store quote info and prompt for game
    //    that followup will need to retrieve the stored info, save for game, post a message, and ask if it should save the chosen game as the default for this channel
    //    the followup after that either saves the game as default or scraps it, replies either way

    return interaction.reply(`The quote: "${text}" ~ ${speaker_name}`)
  },
}
