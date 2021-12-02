// Load envvars
require("dotenv").config();

// Require the necessary discord.js classes
const fs = require("fs");
const { Client, Collection, Intents } = require("discord.js");
const { jsNoTests } = require("./util/filters");

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS] });
const token = process.env.BOT_TOKEN;

// Store commands (slash commands, context menu commands)
client.commands = new Collection();
const commandFiles = fs
    .readdirSync("./commands")
    .filter(jsNoTests);
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    // Set a new item in the Collection
    // With the key as the command name and the value as the exported module
    client.commands.set(command.name, command);
}

// Store interaction followups (select menus, buttons)
client.followups = new Collection();
const followupFiles = fs
    .readdirSync("./followups")
    .filter(jsNoTests);
for (const file of followupFiles) {
    const followup = require(`./followups/${file}`);
    client.followups.set(followup.name, followup);
}

// Register event listeners
const eventFiles = fs
    .readdirSync("./events")
    .filter(jsNoTests);
for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Login to Discord with your client's token
client.login(token);
