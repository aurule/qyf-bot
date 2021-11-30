const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rand-quote")
    .setDescription("Show a random quote from the current game")
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
      option.setName("game").setDescription("From a game")
    ),
  async execute(interaction) {
    const speaker = interaction.options.getUser("speaker")
    const alias = interaction.options.getString("alias")
    const text = interaction.options.getString("text")
    const game = interaction.options.getString("game")

    await interaction.reply(`Showing a random quote`)
  },
}
