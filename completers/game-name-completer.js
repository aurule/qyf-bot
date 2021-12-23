const { Guilds, Games } = require("../models")
const { Op } = require("sequelize")

module.exports = {
  /**
   * Create and send autocomplete data for game name
   *
   * The value returned is the game ID in string format
   *
   * @param  {AutocompleteInteraction} interaction  Discord autocomplete interaction object
   * @return {Promise}                              A promise for the interaction response
   */
  async complete(interaction) {
    const guild = await Guilds.findByInteraction(interaction, {
      include: {
        model: Games,
        where: {
          name: { [Op.substring]: interaction.options.getFocused() }
        }
      }
    })

    if (!guild) {
      return interaction.respond([])
    }

    return interaction.respond(
      guild.Games.map((g) => {
        return { name: g.name, value: g.id.toString() }
      })
    )
  },
}
