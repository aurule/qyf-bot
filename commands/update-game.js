const { SlashCommandBuilder } = require("@discordjs/builders")
const { Guilds, Games } = require("../models")
const { UniqueConstraintError } = require("sequelize")
const Commands = require("../services/commands")
const GameChoicesTransformer = require("../transformers/game-choices-transformer")
const { logger } = require("../util/logger")

module.exports = {
  name: "update-game",
  data: (guild) =>
    new SlashCommandBuilder()
      .setName("update-game")
      .setDescription("Change the name or description of a game")
      .addIntegerOption((option) =>
        option
          .setName("game")
          .setDescription("The game to update")
          .addChoices(GameChoicesTransformer.transform(guild.Games))
          .setRequired(true)
      )
      .addStringOption((option) =>
        option.setName("name").setDescription("The new name of the game")
      )
      .addStringOption((option) =>
        option
          .setName("description")
          .setDescription("A few words about the game")
      ),
  async execute(interaction) {
    const gameId = interaction.options.getInteger("game")
    const game_name = interaction.options.getString("name")
    const description = interaction.options.getString("description")

    if(!(game_name || description)) {
      return interaction.reply(`You need to give a new name or new description!`)
    }

    var guild
    var game

    try {
      guild = await Guilds.findByInteraction(interaction)

      game = await Games.findOne({
        where: { id: gameId, guildId: guild.id },
      })
    } catch(error) {
      logger.error("Error fetching guild or game", error)
      return interaction.reply("Something went wrong :-(")
    }

    if(!game) {
      logger.error(`Game ${gameId} not found for guild ${guild.id}`)
      return interaction.reply("Something went wrong :-(")
    }

    const update_params = {}
    if(game_name) update_params.name = game_name
    if(description) update_params.description = description

    try {
      await game.update(update_params)
    } catch(error) {
      logger.error("Error updating game", error)
      return interaction.reply("Something went wrong :-(")
    }

    await Commands.deployToGuild(guild)

    // reply with description of changes

    return interaction.reply(`Chose game "${game_name}"`)
  },
}