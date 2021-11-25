const { Guilds, Games } = require("../models");

module.exports = {
  name: "guildCreate",
  async execute(guild) {
    const [guild_record, _isNew] = await Guilds.upsert({
      name: guild.name,
      snowflake: guild.id,
    });

    await Games.upsert({
      name: "No Game",
      guildId: guild_record.id,
    });
  },
};
