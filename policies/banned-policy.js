const { Permissions } = require("discord.js")

const { Bans, Users } = require("../models")

const errorMessage = "You are banned from using this command"

module.exports = {
  allow: async (interaction) => {
    return Bans.scope("active")
      .findOne({
        where: {
          bannableType: "Users",
        },
        include: {
          model: Users,
          required: true,
          where: {
            snowflake: interaction.user.id.toString(),
          },
        },
        limit: 1,
      })
      .then((record) => !record)
  },
  errorMessage,
}
