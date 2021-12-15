const { SlashCommandBuilder } = require("@discordjs/builders")
const { Guilds, Games, DefaultGames } = require("../models")
const { transform } = require("../transformers/game-list-transformer")

module.exports = {
  name: "list-games",
  data: (guild) => new SlashCommandBuilder()
    .setName("list-games")
    .setDescription("Show the games for this server"),
  async execute(interaction) {
    const guild = await Guilds.findByInteraction(interaction)
    const games = await Games.findAll({
      where: { guildId: guild.id },
      order: [["name", "ASC"]],
      include: DefaultGames,
    })

    const reply_text = transform(games)

    return interaction.reply(reply_text)
  },
}
