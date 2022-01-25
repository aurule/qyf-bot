const { Guilds, Games } = require("../models")
const GamesForGuild = require("../caches/games-for-guild")

/**
 * The special value for the all games selector
 * @type {Number}
 */
const ALL_GAMES = -1

module.exports = {
  /**
   * Create and send autocomplete data for game name
   *
   * Returns an array of objects with game name and game ID values. Includes
   * all games from the current guild, plus a special All Games meta-option.
   *
   * @param  {AutocompleteInteraction} interaction  Discord autocomplete interaction object
   * @return {Promise}                              A promise for the interaction response
   */
  async complete(interaction) {
    const data = await GamesForGuild.get(interaction.guildId.toString())

    const options = data
      .filter((game) => game.name.toLowerCase().includes(interaction.options.getFocused()))
      .map((game) => {
        return { name: game.name, value: game.id.toString() }
      })
    options.push({ name: "All Games", value: ALL_GAMES.toString()})

    return interaction.respond(options)
  },
  ALL_GAMES,
}