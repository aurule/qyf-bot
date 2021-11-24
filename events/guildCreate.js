const { Guilds } = require("../models");

module.exports = {
    name: "guildCreate",
    execute(guild) {
        await Guilds.create({
            name: guild.name,
            snowflake: guild.id,
        });
    },
};
