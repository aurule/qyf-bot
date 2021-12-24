"use strict"

require("dotenv").config()

const { logger } = require("../util/logger")
const { REST } = require("@discordjs/rest")
const { Routes } = require("discord-api-types/v9")

const { Guilds, Games } = require("../models")
const commandFetch = require("./command-fetch")

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
  return commandFetch.guild().map(c => c.data(guild).toJSON())
}

/**
 * Push the guild command JSON to a specific guild
 * @param  {Guild} guild  The guild object to receive the command data
 * @return {Promise}      Promise for the http call
 */
async function deployToGuild(guild) {
  if (!guild.Games) await guild.reload({ include: Games })

  return restClient()
    .put(Routes.applicationGuildCommands(clientId, guild.snowflake), {
      body: buildGuildCommandJSON(guild),
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
function buildGlobalCommandJSON() {
  return commandFetch.global().map(c => c.data().toJSON())
}

/**
 * Push the global command JSON
 * @return {Promise}      Promise for the http call
 */
async function deployGlobals() {
  logger.info("Deploying global commands")

  return restClient()
    .put(Routes.applicationCommands(clientId), {
      body: buildGlobalCommandJSON(),
    })
    .catch((error) => {
      logger.warn(`Error deploying global commands: ${error}`)
    })
    .finally(() => {
      logger.info("Done with globals")
    })
}

/**
 * Build global commands as though they're guild commands and push to the dev servers
 * @return {Promise}      Promise for the http call
 */
async function deployDev() {
  const devFlakes = JSON.parse(process.env.DEV_GUILDS)
  const guilds = await Guilds.findAll({ where: { snowflake: devFlakes } })

  logger.info("Deploying global commands as guild commands to dev servers")

  const commandJSON = buildGlobalCommandJSON()

  return Promise
    .all(guilds.map(guild => restClient()
      .put(Routes.applicationGuildCommands(clientId, guild.snowflake), {
        body: commandJSON,
      })
      .catch((error) => {
        logger.warn(`Error deploying commands to guild ${guild.name}: ${error}`)
      })
      .finally(() => {
        logger.info(`Deployed to guild ${guild.name}`)
      })))
    .finally(() => {
      logger.info("Done with dev guilds")
    })
}

module.exports = {
  buildGuildCommandJSON,
  buildGlobalCommandJSON,
  restClient,
  deployToGuild,
  deployToAllGuilds,
  deployGlobals,
  deployDev,
}
