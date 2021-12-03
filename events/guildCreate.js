const { Guilds, Games, DefaultGames } = require("../models")

module.exports = {
  name: "guildCreate",
  async execute(discord_guild) {
    const [guild, _isNewGuild] = await Guilds.findOrCreate({
      where: {
        snowflake: discord_guild.id.toString(),
      },
      defaults: {
        name: discord_guild.name,
        snowflake: discord_guild.id.toString(),
      },
    })

    const [game, _isNewGame] = await Games.findOrCreate({
      where: {
        name: "No Game",
        guildId: guild.id,
      },
      defaults: {
        name: "No Game",
        guildId: guild.id,
      },
    })
  },
}
