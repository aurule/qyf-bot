const { Permissions } = require('discord.js');

const errorMessage = "You need to be a guild manager or channel manager to use this command"

module.exports = {
  allow: async (interaction) => {
    return interaction.member.permissions.any([
      Permissions.FLAGS.MANAGE_GUILD,
      Permissions.FLAGS.MANAGE_CHANNELS,
    ])
  },
  errorMessage,
}
