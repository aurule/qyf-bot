const { Guilds, Games } = require("../models")
const GamesForGuild = require("../caches/games-for-guild")

module.exports = {
  /**
   * Create and send autocomplete data for game names
   *
   * Returns an array of objects with game name and game ID values. Includes
   * games for the interaction's guild.
   *
   * @param  {AutocompleteInteraction} interaction  Discord autocomplete interaction object
   * @return {Promise}                              A promise for the interaction response
   */
  async complete(interaction) {
    const data = await GamesForGuild.get(interaction.guildId.toString())

    return interaction.respond(
      data
        .filter((game) => game.name.toLowerCase().includes(interaction.options.getFocused().toLowerCase()))
        .map((game) => {
          return { name: game.name, value: game.name }
        })
    )
  }
}
