const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageActionRow, MessageSelectMenu } = require("discord.js")
const { keyv } = require("../util/keyv.js")
const { Guilds, Games, DefaultGames } = require("../models")
const GameSelectTransformer = require("../transformers/game-select-transformer")
const { explicitScope } = require("../services/default-game-scope")
const GameChoicesTransformer = require("../transformers/game-choices-transformer")
const { logger } = require("../util/logger")

module.exports = {
  name: "set-default-game",
  data: (guild) => new SlashCommandBuilder()
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
    const current_channel = interaction.channel
    const channel_option = interaction.options.getChannel("channel")
    const target_channel = channel_option ? channel_option : current_channel
    const server_wide = interaction.options.getBoolean("server")
    const game_id = interaction.options.getInteger("game")

    const command_options = explicitScope(target_channel, server_wide)

    try {
      await DefaultGames.upsert({
        name: command_options.name,
        type: command_options.target_type,
        snowflake: command_options.target_snowflake,
        gameId: game_id,
      })
    } catch (error) {
      logger.warn(error)
      return interaction.reply({
        content: "Something went wrong :-(",
        components: [],
        ephemeral: true
      })
    }

    const game = await Games.findOne({ where: { id: game_id } })

    return interaction.reply(
      `${game.name} is now the default for ${command_options.name}.`
    )
  },
}
