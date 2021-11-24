// Load envvars
require("dotenv").config();

const logger = require('pino')()
const fs = require("fs");
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const token = process.env.BOT_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

const commands = [];
const commandFiles = fs
    .readdirSync("./commands")
    .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    commands.push(command.data.toJSON());
}

const rest = new REST({ version: "9" }).setToken(token);

(async () => {
    try {
        logger.info("Started refreshing application commands.");

        await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
            body: commands,
        });

        logger.info("Successfully refreshed application commands.");
    } catch (error) {
        logger.error(error);
    }
})();
