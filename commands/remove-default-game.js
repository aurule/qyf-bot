const { SlashCommandBuilder, PermissionFlagsBits, underscore } = require("discord.js")
const { stripIndent, oneLine } = require("common-tags")

const { explicitScope } = require("../services/default-game-scope")
const { DefaultGames } = require('../models')

module.exports = {
  name: "remove-default-game",
  description: "Remove the default game for this channel",
  data: () => new SlashCommandBuilder()
    .setName(module.exports.name)
    .setDescription(module.exports.description)
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The target channel")
    )
    .addBooleanOption((option) =>
      option.setName("server").setDescription("Remove the server default")
    )
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
  async execute(interaction) {
    const current_channel = interaction.channel
    const channel_option = interaction.options.getChannel("channel")
    const target_channel = channel_option ? channel_option : current_channel
    const server_wide = interaction.options.getBoolean("server")

    const scope = explicitScope(target_channel, server_wide)

    await DefaultGames.destroy({where: {snowflake: scope.target_snowflake}})

    return interaction.reply(`Removed default game from ${scope.scopeMention()}`)
  },
  help({ command_name }) {
    return [
      oneLine`
        ${command_name} clears this channel's default game. The game is still available, but will not be
        automatically used by commands in this channel.
      `,
      "",
      stripIndent`
        Args:
            \`channel\`: Different channel (or category) whose default game should be cleared
            \`server\`: Whether to clear the server-wide default game
      `,
      "",
      oneLine`
        With no options, ${command_name} will clear the default game from the current channel. If a
        \`channel\` is provided, it will instead clear the default game of that channel. Note that Discord
        lets you pass a category, or channel group, for the \`channel\` option. This works just fine!
      `,
      "",
      oneLine`
        The \`server\` option overrides \`channel\` and causes ${command_name} to clear the server-wide
        default game.
      `,
      "",
      `For more info on how default games work, check out the ${underscore("Default Games")} topic in \`/qyf-help\`.`
    ].join("\n")
  },
}
