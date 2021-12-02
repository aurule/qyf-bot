"use strict"

require("dotenv").config()

const { logger } = require("../util/logger")
const fs = require("fs")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const { jsNoTests } = require("../util/filters")

const { Guilds, Games } = require("../models")

const token = process.env.BOT_TOKEN
const clientId = process.env.CLIENT_ID

const rest = new REST({ version: "9" }).setToken(token)

const commandsDir = `${__dirname}/../commands`

/**
 * Build the command json to send to Discord
 * @param  {Guild} guild  The guild object to use for building the commands
 * @return {string} JSON data about our slash commands
 */
function buildCommandJSON(guild) {
  const commands = []
  const commandFiles = fs.readdirSync(commandsDir).filter(jsNoTests)

  for (const file of commandFiles) {
    const command = require(`${commandsDir}/${file}`)
    commands.push(command.data(guild).toJSON())
  }

  return commands
}

/**
 * Push the command JSON to a specific guild
 * @param  {Guild} guild  The guild object to receive the command data
 * @return {Promise}      Promise for the http call
 */
async function deployToGuild(guild) {
  logger.info(`Pushing commands to guild ${guild.name}`)
  const commands = buildCommandJSON(guild)

  return rest
    .put(Routes.applicationGuildCommands(clientId, guild.snowflake), {
      body: commands,
    })
    .catch((error) => {
      logger.warn(`Error pushing commands to guild ${guild.name}: ${error}`)
    })
    .finally(() => {
      logger.info(`Pushed to guild ${guild.name}`)
    })
}

/**
 * Push the command JSON to all guilds in our database
 * @return {null} No return value
 */
async function deployToAllGuilds() {
  const guilds = await Guilds.findAll({include: Games})

  logger.info("Pushing commands to all guilds")
  Promise.all(guilds.map((g) => deployToGuild(g))).finally(() => {
    logger.info("Done with all guilds")
  })
}

module.exports = {
  buildCommandJSON,
  deployToGuild,
  deployToAllGuilds,
}
