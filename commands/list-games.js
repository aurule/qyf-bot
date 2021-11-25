const { SlashCommandBuilder } = require("@discordjs/builders");
const { channelMention } = require("@discordjs/builders");
const { Guilds, Games, DefaultGames } = require("../models");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("list-games")
    .setDescription("Show the games for this server"),
  async execute(interaction) {

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
