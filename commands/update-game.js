const { SlashCommandBuilder } = require("@discordjs/builders")
const { stripIndent, oneLine } = require("common-tags")
const { UniqueConstraintError } = require("sequelize")
const { Collection } = require("discord.js")

const { Guilds, Games } = require("../models")
const { logger } = require("../util/logger")
const CommandPolicy = require("../services/command-policy")
const GameNameCompleter = require("../completers/game-name-completer")
const GamesForGuild = require("../caches/games-for-guild")

module.exports = {
  name: "update-game",
  policy: CommandPolicy,
  data: () =>
    new SlashCommandBuilder()
      .setName("update-game")
      .setDescription("Change the name or description of a game")
      .addIntegerOption((option) =>
        option
          .setName("game")
          .setDescription("The game to update")
          .setAutocomplete(true)
      )
      .addStringOption((option) =>
        option.setName("name").setDescription("The new name of the game")
      )
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("A few words about the game")
      ),
  autocomplete: new Collection([
    ['game', GameNameCompleter]
  ]),
  async execute(interaction) {
    const game_arg = Number(interaction.options.getString("game"))
    const game_name = interaction.options.getString("name")
    const description = interaction.options.getString("description")

    if (!game_arg) {
      return interaction.reply({
        content: `There is no game called "${interaction.options.getString("game")}"`,
        ephemeral: true,
      })
    }

    if (!(game_name || description)) {
      return interaction.reply({
        content: `You need to give a new name or new description!`,
        ephemeral: true,
      })
    }

    var guild
    var game

    try {
      guild = await Guilds.findByInteraction(interaction)

      game = await Games.findOne({
        where: { id: game_arg, guildId: guild.id },
      })
    } catch (error) {
      logger.error("Error fetching guild or game", error)
      throw(error)
    }

    if (!game) {
      logger.error(`Game ${game_arg} not found for guild ${guild.id}`)
      return interaction.reply("Something went wrong :-(")
    }

    const update_params = {}
    if (game_name) update_params.name = game_name
    if (description) update_params.description = description

    try {
      await game.update(update_params)
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        return interaction.reply(`The game "${game_name}" already exists!`)
      }
      logger.error("Error updating game", error)
      throw(error)
    }

    await GamesForGuild.delete(guild.snowflake)

    return interaction.reply(`Updated game "${game.name}"`)
  },
  help({ command_name }) {
    return [
      oneLine`
        ${command_name} changes the details of a game that's already on this server. It can only be used by
        people with the Manage Channels or Manage Server permissions.
      `,
      "",
      stripIndent`
        Args:
            \`game\`: (required) The game to modify
            \`name\`: The name to use for the new game
            \`description\`: A few words or a sentence describing the game
      `,
      "",
      oneLine`
        Every game on a server must have a unique name. If you try to reuse a name, ${command_name} will tell
        you that that game already exists.
      `,
    ].join("\n")
  },
}
