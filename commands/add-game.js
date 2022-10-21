const { SlashCommandBuilder } = require("discord.js")
const { stripIndent, oneLine } = require("common-tags")

const { Guilds, Games } = require("../models")
const { UniqueConstraintError } = require("sequelize")
const { logger } = require("../util/logger")
const GamesForGuild = require("../caches/games-for-guild")

module.exports = {
  name: "add-game",
  description: "Add a game to this server",
  data: () =>
    new SlashCommandBuilder()
      .setName(module.exports.name)
      .setDescription(module.exports.description)
      .addStringOption((option) =>
        option
          .setName("name")
          .setDescription("The name of the game")
          .setRequired(true)
      )
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("A few words about the game")
      )
      .setDMPermission(false),
  async execute(interaction) {
    const game_name = interaction.options.getString("name")
    const description = interaction.options.getString("description")

    const guild = await Guilds.findByInteraction(interaction)

    try {
      await Games.create({
        name: game_name,
        guildId: guild.id,
        description: description,
      })
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        return interaction.reply(`The game "${game_name}" already exists!`)
      }
      throw error
    }

    await GamesForGuild.delete(guild.snowflake)

    return interaction.reply(
      oneLine`
        Added game "${game_name}"! Quote away! You can also use \`/set-default-game\`
        to make it the default for a channel or for the server.
      `
    )
  },
  help({ command_name }) {
    return [
      oneLine`
        ${command_name} adds a new game for quotes on this server.
      `,
      "",
      stripIndent`
        Args:
            \`name\`: (required) The name to use for the new game
            \`description\`: A few words or a sentence describing the game
      `,
      "",
      oneLine`
        Every game on a server must have a unique name. If you try to reuse a name, ${command_name} will tell
        you that that game already exists. You can pick a new name for your new game, or you can use
        \`/update-game\` to change the name of the old game.
      `,
    ].join("\n")
  },
}
