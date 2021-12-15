const { SlashCommandBuilder } = require("@discordjs/builders")
const { explicitScope } = require("../services/default-game-scope")
const { DefaultGames } = require('../models')
const CommandPolicy = require("../services/command-policy")

module.exports = {
  name: "remove-default-game",
  data: (guild) => new SlashCommandBuilder()
    .setName("remove-default-game")
    .setDescription("Remove the default game for this channel")
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The target channel")
    )
    .addBooleanOption((option) =>
      option.setName("server").setDescription("Remove the server default")
    ),
  async execute(interaction) {
    if(!CommandPolicy.elevateMember(interaction.member)) {
      return interaction.reply({content: CommandPolicy.errorMessage, ephemeral: true})
    }

    const current_channel = interaction.channel
    const channel_option = interaction.options.getChannel("channel")
    const target_channel = channel_option ? channel_option : current_channel
    const server_wide = interaction.options.getBoolean("server")

    const scope = explicitScope(target_channel, server_wide)

    await DefaultGames.destroy({where: {snowflake: scope.target_snowflake}})

    return interaction.reply(`Removed default game from ${scope.scope_text}`)
  },
}
