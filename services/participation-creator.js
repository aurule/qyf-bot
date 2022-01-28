const { Guilds, Users, Participations } = require("../models")

module.exports = {
  /**
   * Create a Participation record for the user and guild of an interaction
   *
   * @param  {Interaction}                  interaction Discord interaction
   * @return {Promise<null|Array<Participation, bool>>} Participation record and isNew flag, or null if there is no guild
   */
  async findOrCreateByInteraction(interaction) {
    if (!interaction.guildId) return null

    const [guild, _isNewGuild] = await Guilds.findOrCreate({
      where: {
        snowflake: interaction.guildId.toString(),
      },
      defaults: {
        name: interaction.guild.name,
      },
    })

    const [user, _isNewUser] = await Users.findOrCreate({
      where: {
        snowflake: interaction.user.id.toString()
      },
      defaults: {
        name: interaction.user.username,
      }
    })

    return Participations.findOrCreate({
      where: {
        userId: user.id,
        guildId: guild.id,
      }
    })
  }
}
