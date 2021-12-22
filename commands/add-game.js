const { SlashCommandBuilder } = require("@discordjs/builders")
const { Guilds, Games } = require("../models")
const { UniqueConstraintError } = require("sequelize")
const CommandDeploy = require("../services/command-deploy")
const { logger } = require("../util/logger")
const CommandPolicy = require("../services/command-policy")

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
    if(!CommandPolicy.elevateMember(interaction.member)) {
      return interaction.reply({content: CommandPolicy.errorMessage, ephemeral: true})
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
      throw(error)
    }

    await CommandDeploy.deployToGuild(guild)

    return interaction.reply(`Added game "${game_name}"`)
  },
}
