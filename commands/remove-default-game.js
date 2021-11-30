const { SlashCommandBuilder } = require("@discordjs/builders")

module.exports = {
  data: new SlashCommandBuilder()
    .setName("remove-default-game")
    .setDescription("Remove the default game for this channel")
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The target channel")
    )
    .addBooleanOption((option) =>
      option.setName("server").setDescription("Remove the server default")
    ),
  async execute(interaction) {
    const current_channel = interaction.channel
    const channel_option = interaction.options.getChannel("channel")
    const target_channel = channel_option ? channel_option : current_channel

    const server_wide = interaction.options.getBoolean("server")

    const scope = server_wide ? "the server" : target_channel

    await interaction.reply(`Removed default game from ${scope}`)
  },
}
