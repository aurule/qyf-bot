const { SlashCommandBuilder } = require("@discordjs/builders")
const { stripIndent, oneLine } = require("common-tags")

const { Games, DefaultGames } = require("../models")
const { explicitScope } = require("../services/default-game-scope")
const GameChoicesTransformer = require("../transformers/game-choices-transformer")
const { logger } = require("../util/logger")
const CommandPolicy = require("../services/command-policy")

module.exports = {
  name: "set-default-game",
  data: (guild) =>
    new SlashCommandBuilder()
      .setName("set-default-game")
      .setDescription("Set the default game for this channel")
      .addIntegerOption((option) =>
        option
          .setName("game")
          .setDescription("The game to use")
          .setRequired(true)
          .addChoices(GameChoicesTransformer.transform(guild.Games))
      )
      .addChannelOption((option) =>
        option.setName("channel").setDescription("The target channel")
      )
      .addBooleanOption((option) =>
        option
          .setName("server")
          .setDescription("Apply default to the whole server")
      ),
  async execute(interaction) {
    if (!CommandPolicy.elevateMember(interaction.member)) {
      return interaction.reply({
        content: CommandPolicy.errorMessage,
        ephemeral: true,
      })
    }

    const current_channel = interaction.channel
    const channel_option = interaction.options.getChannel("channel")
    const target_channel = channel_option ? channel_option : current_channel
    const server_wide = interaction.options.getBoolean("server")
    const game_id = interaction.options.getInteger("game")

    const command_options = explicitScope(target_channel, server_wide)

    await DefaultGames.upsert({
      name: command_options.name,
      type: command_options.target_type,
      snowflake: command_options.target_snowflake,
      gameId: game_id,
    })

    const game = await Games.findOne({ where: { id: game_id } })

    return interaction.reply(
      `${game.name} is now the default for ${command_options.name}.`
    )
  },
  help({ command_name }) {
    return [
      oneLine`
        ${command_name} sets this channel's default game.
      `,
      "",
      stripIndent`
        Args:
            \`game\`: (required) The game to set as the default
            \`channel\`: Different channel (or category) whose default game should be set
            \`server\`: Whether to set the server-wide default game
      `,
      "",
      oneLine`
        With just a game, ${command_name} will set the chosen game as the default for the current channel. If
        a \`channel\` is provided, it will instead be set as the default for that channel. Note that Discord
        lets you pass a category, or channel group, for the \`channel\` option. This works just fine!
      `,
      "",
      oneLine`
        The \`server\` option overrides \`channel\` and causes ${command_name} to set the game as the
        server-wide default.
      `,
      "",
      "For more info on how default games work, check out the *Default Games* topic in `/qyf-help`."
    ].join("\n")
  },
}
