const { SlashCommandBuilder } = require("@discordjs/builders")
const { Guilds, Games, DefaultGames } = require("../models")
const { present } = require("../presenters/game-list-presenter")
const { stripIndent, oneLine } = require("common-tags")

module.exports = {
  name: "list-games",
  description: "Show the games for this server",
  data: () => new SlashCommandBuilder()
    .setName(module.exports.name)
    .setDescription(module.exports.description),
  async execute(interaction) {
    const guild = await Guilds.findByInteraction(interaction)
    const games = await Games.findAll({
      where: { guildId: guild.id },
      order: [["name", "ASC"]],
      include: DefaultGames,
    })

    const reply_text = present(games)

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
