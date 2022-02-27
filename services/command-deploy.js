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
  buildGlobalCommandJSON,
  restClient,
  deployGlobals,
  deployDev,
}
