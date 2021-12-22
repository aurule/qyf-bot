const { SlashCommandBuilder } = require("@discordjs/builders")
const { Guilds, Games } = require("../models")
const { UniqueConstraintError } = require("sequelize")
const CommandDeploy = require("../services/command-deploy")
const { logger } = require("../util/logger")
const CommandPolicy = require("../services/command-policy")
const { stripIndent, oneLine } = require("common-tags")

module.exports = {
  name: "add-game",
  data: (guild) =>
    new SlashCommandBuilder()
      .setName("add-game")
      .setDescription("Add a game to this server")
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
      ),
  async execute(interaction) {
    if (!CommandPolicy.elevateMember(interaction.member)) {
      return interaction.reply({
        content: CommandPolicy.errorMessage,
        ephemeral: true,
      })
    }

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

    await CommandDeploy.deployToGuild(guild)

    return interaction.reply(`Added game "${game_name}"`)
  },
  help({ command_name }) {
    return [
      oneLine`
        ${command_name} adds a new game for quotes on this server. It can only be used by people with the
        Manage Channels or Manage Server permissions.
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
