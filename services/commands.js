"use strict"

require("dotenv").config()

const { logger } = require("../util/logger")
const fs = require("fs")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const { jsNoTests } = require("../util/filters")

const { Guilds } = require("../models")

const token = process.env.BOT_TOKEN
const clientId = process.env.CLIENT_ID

const rest = new REST({ version: "9" }).setToken(token)

const commandsDir = `${__dirname}/../commands`
const commands = []

function buildCommands() {
  if (commands.length) return commands

  const commandFiles = fs.readdirSync(commandsDir).filter(jsNoTests)

  for (const file of commandFiles) {
    const command = require(`${commandsDir}/${file}`)
    commands.push(command.data.toJSON())
  }

  return commands
}

async function deployToGuild(guild) {
  logger.info(`Pushing commands to guild ${guild.name}`)
  buildCommands()

  return rest
    .put(Routes.applicationGuildCommands(clientId, guild.snowflake), {
      body: commands,
    })
    .catch(() => {
      logger.warning(`Error pushing commands to guild ${guild.name}: ${error}`)
    })
    .finally(() => {
      logger.info(`Pushed to guild ${guild.name}`)
    })
}

async function deployToAllGuilds() {
  const guilds = await Guilds.findAll()

  logger.info("Pushing commands to all guilds")
  Promise.all(guilds.map((g) => deployToGuild(g))).finally(() => {
    logger.info("Done with all guilds")
  })
}

module.exports = {
  commands,
  buildCommands,
  deployToGuild,
  deployToAllGuilds,
}
