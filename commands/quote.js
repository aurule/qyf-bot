const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
  data: new SlashCommandBuilder()
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

    const member_name = interaction.guild.members.fetch(speaker).nickname
    const speaker_name = member_name ? member_name : speaker.username
    const name = alias ? alias : speaker_name

    await interaction.reply(`The quote: "${text}" ~ ${name}`)
  },
}
