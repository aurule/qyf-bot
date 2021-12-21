"use strict"

require("dotenv").config()

const { logger } = require("../util/logger")
const fs = require("fs")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")
const { jsNoTests } = require("../util/filters")

const { Guilds, Games } = require("../models")

const guildCommandsDir = `${__dirname}/../commands`
const globalCommandsDir = `${__dirname}/../commands/global`
const clientId = process.env.CLIENT_ID

/**
 * Helper to create a REST instance
 * @return {REST} REST client instance
 */
function restClient() {
  const token = process.env.BOT_TOKEN
  return new REST({ version: "9" }).setToken(token)
}

/**
 * Build the guild commands json to send to Discord
 * @param  {Guild} guild  The guild object to use for building the commands
 * @return {string} JSON data about the guild's slash commands
 */
function buildGuildCommandJSON(guild) {
  const commands = []
  const guildCommandFiles = fs.readdirSync(guildCommandsDir).filter(jsNoTests)

  for (const file of guildCommandFiles) {
    const command = require(`${guildCommandsDir}/${file}`)
    commands.push(command.data(guild).toJSON())
  }

  return commands
}

/**
 * Push the guild command JSON to a specific guild
 * @param  {Guild} guild  The guild object to receive the command data
 * @return {Promise}      Promise for the http call
 */
async function deployToGuild(guild) {
  if (!guild.Games) await guild.reload({ include: Games })

  const commands = buildGuildCommandJSON(guild)

  return restClient()
    .put(Routes.applicationGuildCommands(clientId, guild.snowflake), {
      body: commands,
    })
    .catch((error) => {
      logger.warn(`Error deploying commands to guild ${guild.name}: ${error}`)
    })
    .finally(() => {
      logger.info(`Deployed to guild ${guild.name}`)
    })
}

/**
 * Push the guild command JSON to many guilds
 * @param  {Array<Guilds>|null} Array of guilds to deploy commands, or null for all guilds
 * @return {null}               Promise for all deploy calls
 */
async function deployToAllGuilds(guilds = null) {
  if (!guilds) guilds = await Guilds.findAll({ include: Games })

  logger.info("Deploying commands to all guilds")
  return Promise
    .all(guilds.map(g => this.deployToGuild(g)))
    .finally(() => {
      logger.info("Done with all guilds")
    })
}

/**
 * Build the global command json to send to Discord
 * @return {string} JSON data about our global slash commands
 */
function buildGlobalCommandJSON(guild) {
  const commands = []
  const globalCommandFiles = fs.readdirSync(globalCommandsDir).filter(jsNoTests)

  for (const file of globalCommandFiles) {
    const command = require(`${globalCommandsDir}/${file}`)
    commands.push(command.data().toJSON())
  }

  return commands
}

/**
 * Push the global command JSON
 * @return {Promise}      Promise for the http call
 */
async function deployGlobals() {
  logger.info("Deploying global commands")

  const commands = buildGlobalCommandJSON()

  return restClient()
    .put(Routes.applicationCommands(clientId), {
      body: commands,
    })
    .catch((error) => {
      logger.warn(`Error deploying global commands: ${error}`)
    })
    .finally(() => {
      logger.info("Done with globals")
    })
}

module.exports = {
  buildGuildCommandJSON,
  buildGlobalCommandJSON,
  restClient,
  deployToGuild,
  deployToAllGuilds,
  deployGlobals,
}
