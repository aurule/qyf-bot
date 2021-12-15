const { Permissions } = require('discord.js');

module.exports = {
  elevateMember: (member) => {
    return member.permissions.any([
      Permissions.FLAGS.MANAGE_GUILD,
      Permissions.FLAGS.MANAGE_CHANNELS,
    ])
  },
  errorMessage: "You need to be a guild manager or channel manager to use this command"
}
