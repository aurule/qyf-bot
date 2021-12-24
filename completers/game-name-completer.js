const { Guilds, Games } = require("../models")
const GamesForGuild = require("../caches/games-for-guild")

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
    const data = await GamesForGuild.get(interaction.guildId.toString())

    return interaction.respond(
      data
        .filter((game) => game.name.toLowerCase().includes(interaction.options.getFocused()))
        .map((game) => {
          return { name: game.name, value: game.id.toString() }
        })
    )
  }
}
