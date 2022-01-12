const { logger } = require("../util/logger")

/**
 * Handle command interactions
 *
 * We first apply the command's policy, then execute the actual command
 *
 * @param  {Interaction} interaction  Discord interaction object
 * @return {Promise}                  Promise, probably from replying to the
 *                                    interaction. Rejects if command not found.
 */
async function handleCommand(interaction) {
  const command = interaction.client.commands.get(interaction.commandName)

  if (!command) return Promise.reject()

  const allowed = command.policy ? await command.policy.allow(interaction) : true

  if (!allowed) {
    return interaction
      .reply({
        content: command.policy.errorMessage,
        ephemeral: true,
      })
  }

  return command.execute(interaction)
}

/**
 * Handle select menu interactions
 *
 * @param  {Interaction} interaction  Discord interaction object
 * @return {Promise}                  Promise, probably from replying to the
 *                                    interaction. Rejects if select menu
 *                                    followup not found.
 */
async function handleSelectMenu(interaction) {
  const followup = interaction.client.followups.get(interaction.customId)

  if (!followup) return Promise.reject()

  return followup.execute(interaction)
}

/**
 * Handle autocomplete interactions
 *
 * @param  {Interaction} interaction  Discord interaction object
 * @return {Promise}                  Promise, probably from responding to the
 *                                    interaction. Rejects if command or
 *                                    completer isn't found.
 */
async function handleAutocomplete(interaction) {
  const command = interaction.client.commands.get(interaction.commandName)
  if (!command) return Promise.reject()

  const option = interaction.options.getFocused(true)
  const completer = command.autocomplete.get(option.name)
  if (!completer) return Promise.reject()

  return completer.complete(interaction)
}

module.exports = {
  name: "interactionCreate",
  handleCommand,
  handleSelectMenu,
  handleAutocomplete,
  execute(interaction) {
    if (
      (process.env.NODE_ENV !== "development") ==
      process.env.DEV_GUILDS.includes(interaction.guildId)
    ) {
      return
    }

    // handle command invocations
    if (interaction.isCommand() || interaction.isApplicationCommand()) {
      return handleCommand(interaction)
        .catch((error) => {
          logger.error(error)
          interaction.reply({
            content: "There was an error while executing this command!",
            components: [],
            ephemeral: true,
          })
        })
    }

    // handle choices on select menu components
    if (interaction.isSelectMenu()) {
      return handleSelectMenu(interaction)
        .catch((error) => {
          logger.error(error)
          interaction.reply({
            content: "There was an error while executing this command!",
            components: [],
            ephemeral: true,
          })
        })
    }

    // handle autocomplete requests
    if (interaction.isAutocomplete()) {
      return handleAutocomplete(interaction)
        .catch((error) => {
          logger.error(error)
          interaction.respond([])
        })
    }
  },
}
