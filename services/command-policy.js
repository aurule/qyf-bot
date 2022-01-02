const { Permissions } = require('discord.js');

function elevateMember(member) {
  return member.permissions.any([
    Permissions.FLAGS.MANAGE_GUILD,
    Permissions.FLAGS.MANAGE_CHANNELS,
  ])
}

const errorMessage = "You need to be a guild manager or channel manager to use this command"

module.exports = {
  allow: (interaction) => {
    return elevateMember(interaction.member)
  },
  elevateMember,
  errorMessage,
}
