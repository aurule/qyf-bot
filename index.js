// Load envvars
require("dotenv").config()

// Require the necessary discord.js classes
const fs = require("fs")
const { Client, Collection, GatewayIntentBits } = require("discord.js")
const { jsNoTests } = require("./util/filters")
const CommandFetch = require("./services/command-fetch")

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] })
const token = process.env.BOT_TOKEN

// Store commands (slash commands, context menu commands)
client.commands = new Collection()
CommandFetch.all().forEach((command) =>
    client.commands.set(command.name, command)
)

// Register event listeners
const eventFiles = fs.readdirSync("./events").filter(jsNoTests)
for (const file of eventFiles) {
    const event = require(`./events/${file}`)
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args))
    } else {
        client.on(event.name, (...args) => event.execute(...args))
    }
}

// Login to Discord with your client's token
client.login(token)
