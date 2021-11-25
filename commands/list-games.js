const { SlashCommandBuilder } = require("@discordjs/builders");
const { channelMention } = require("@discordjs/builders");
const { Guilds, Games, DefaultGames } = require("../models");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("list-games")
    .setDescription("Add a game to this server")
    .addStringOption((option) =>
      option
        .setName("sort")
        .setDescription("How to sort the games")
        .addChoice("By name", "name")
        .addChoice("By total quotes", "num_quotes")
        .addChoice("By where it's default", "default_channel")
    ),
  async execute(interaction) {
    const sort = interaction.options.getString("sort");

    const guild = await Guilds.findOne({
      where: { snowflake: interaction.guild.id },
    });
    const games = await Games.findAll({
      where: { guildId: guild.id },
      attributes: ["name"],
      include: DefaultGames.name,
    });

    const reply_text = games
      .map((game) => {
        const defaults = game.DefaultGames.map((dg) => {
          return dg.name;
        }).join(", ");

        let text = `* ${game.name}`;
        if (defaults) {
          text = text.concat(` (${defaults})`);
        }

        return text;
      })
      .join("\n");

    await interaction.reply(reply_text);
  },
};
