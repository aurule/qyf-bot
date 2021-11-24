const { Guilds } = require("../models");

module.exports = {
    name: "guildCreate",
    async execute(guild) {
        await Guilds.upsert({
            name: guild.name,
            snowflake: guild.id,
        });
    },
};
