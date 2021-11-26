const { SlashCommandBuilder } = require("@discordjs/builders");
const { Guilds, Games } = require("../models");
const { UniqueConstraintError } = require("sequelize");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("add-game")
    .setDescription("Add a game to this server")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the game")
        .setRequired(true)
    ),
  async execute(interaction) {
    const game_name = interaction.options.getString("name");

    const guild = await Guilds.findOne({
      where: { snowflake: interaction.guild.id },
    });

    try {
      await Games.create({ name: game_name, guildId: guild.id });
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        return interaction.reply(`The game "${game_name}" already exists!`);
      }
      return interaction.reply("Something went wrong :-(");
    }

    interaction.reply(`Added game "${game_name}"`);
  },
};
