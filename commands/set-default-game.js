const { SlashCommandBuilder, underscore } = require("@discordjs/builders")
const { stripIndent, oneLine } = require("common-tags")
const { Collection } = require("discord.js")

const { Guilds, Games, DefaultGames } = require("../models")
const { explicitScope } = require("../services/default-game-scope")
const { logger } = require("../util/logger")
const ManagerPolicy = require("../policies/manager-policy")
const GameManageCompleter = require("../completers/game-manage-completer")

module.exports = {
  name: "set-default-game",
  description: "Set the default game for this channel",
  policy: ManagerPolicy,
  data: () =>
    new SlashCommandBuilder()
      .setName(module.exports.name)
      .setDescription(module.exports.description)
      .addStringOption((option) =>
        option
          .setName("game")
          .setDescription("The game to use")
          .setRequired(true)
          .setAutocomplete(true)
      )
      .addChannelOption((option) =>
        option.setName("channel").setDescription("The target channel")
      )
      .addBooleanOption((option) =>
        option
          .setName("server")
          .setDescription("Apply default to the whole server")
      ),
  autocomplete: new Collection([
    ['game', GameManageCompleter]
  ]),
  async execute(interaction) {
    const current_channel = interaction.channel
    const channel_option = interaction.options.getChannel("channel")
    const target_channel = channel_option ? channel_option : current_channel
    const server_wide = interaction.options.getBoolean("server")
    const game_arg = interaction.options.getString("game")

    const scope = explicitScope(target_channel, server_wide)

    const guild = await Guilds.findByInteraction(interaction)
    let game = null
    const gameResult = await guild.getGamesByPartialName(game_arg)
    if (gameResult.length) {
      game = gameResult[0]
    }

    if (!game) {
      logger.error(`Game ${game_arg} not found for guild ${guild.id}`)
      return interaction.reply(`There is no game called "${game_arg}" on this server`)
    }

    await DefaultGames.upsert({
      name: scope.name,
      type: scope.target_type,
      snowflake: scope.target_snowflake,
      gameId: game.id,
    })

    return interaction.reply(
      `${game.name} is now the default for ${scope.scopeMention()}.`
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
      `For more info on how default games work, check out the ${underscore("Default Games")} topic in \`/qyf-help\`.`
    ].join("\n")
  },
}
