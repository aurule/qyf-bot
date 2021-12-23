const { SlashCommandBuilder } = require("@discordjs/builders")
const { Guilds, Games, DefaultGames } = require("../models")
const { transform } = require("../transformers/game-list-transformer")
const { stripIndent, oneLine } = require("common-tags")

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
  help({ command_name }) {
    return [
      oneLine`
        ${command_name} lists the games that are set up on this server
      `,
      "",
      oneLine`
        The games are listed in alphabetical order, with their descriptions (if set) immediately below. Games
        that are set as the default for a channel, category, or the server have that status noted next to their
        names.
      `,
    ].join("\n")
  },
}
