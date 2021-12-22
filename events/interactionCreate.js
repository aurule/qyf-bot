const { logger } = require("../util/logger")

module.exports = {
  name: "interactionCreate",
  execute(interaction) {
    if (
      (process.env.NODE_ENV !== "development") ==
      process.env.DEV_GUILDS.includes(interaction.guildId)
    ) {
      return
    }

    // handle command invocations
    if (interaction.isCommand() || interaction.isApplicationCommand()) {
      const command = interaction.client.commands.get(interaction.commandName)

      if (!command) return

      try {
        command.execute(interaction)
      } catch (error) {
        logger.warn(error)
        interaction.reply({
          content: "There was an error while executing this command!",
          components: [],
          ephemeral: true,
        })
      }
    }

    // handle choices on select menu components
    if (interaction.isSelectMenu()) {
      const followup = interaction.client.followups.get(interaction.customId)

      if (!followup) return

      try {
        followup.execute(interaction)
      } catch (error) {
        logger.warn(error)
        interaction.reply({
          content: "There was an error while executing this command!",
          components: [],
          ephemeral: true,
        })
      }
    }
  },
}
