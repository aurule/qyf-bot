const { Guilds, Games, DefaultGames } = require("../models")

module.exports = {
  name: "guildCreate",
  async execute(discord_guild) {
    if (
      (process.env.NODE_ENV != "development") ==
      process.env.DEV_GUILDS.includes(discord_guild.id)
    ) {
      return
    }

    const [guild, _isNewGuild] = await Guilds.findOrCreate({
      where: {
        snowflake: discord_guild.id.toString(),
      },
      defaults: {
        name: discord_guild.name,
      },
    })

    const [game, _isNewGame] = await Games.findOrCreate({
      where: {
        name: "No Game",
        guildId: guild.id,
      },
    })
  },
}
