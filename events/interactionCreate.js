const { logger } = require("../util/logger")

module.exports = {
  name: "interactionCreate",
  execute(interaction) {
    if (interaction.isCommand() || interaction.isApplicationCommand()) {
      const command = interaction.client.commands.get(interaction.commandName)

      if (!command) return

      try {
        command.execute(interaction)
      } catch (error) {
        logger.debug(error)
        interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        })
      }
    }

    if (interaction.isSelectMenu()) {
      const followup = interaction.client.followups.get(interaction.customId)

      if (!followup) return

      try {
        followup.execute(interaction)
      } catch (error) {
        logger.debug(error)
        interaction.reply({
          content: "There was an error while executing this command!",
          ephemeral: true,
        })
      }
    }
  },
}
