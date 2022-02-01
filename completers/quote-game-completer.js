const { Guilds, Games } = require("../models")
const GamesForGuild = require("../caches/games-for-guild")
const { gameForChannel } = require("../services/default-game-scope")

module.exports = {
  /**
   * Create and send autocomplete data for game name
   *
   * Returns an array of objects with game name and game ID values. Includes
   * different contents based on the presence of a guild.
   *
   * With a guild, it includes all the games for that guild and notes which is
   * the current interaction's default.
   *
   * @param  {AutocompleteInteraction} interaction  Discord autocomplete interaction object
   * @return {Promise}                              A promise for the interaction response
   */
  async complete(interaction) {
    const data = await GamesForGuild.get(interaction.guildId.toString())
    const default_game = await gameForChannel(interaction.channel)

    return interaction.respond(
      data
        .filter((game) => game.name.toLowerCase().includes(interaction.options.getFocused().toLowerCase()))
        .map((game) => {
          let name = game.name
          if (default_game?.id == game.id) name += " (default)"

          return { name: name, value: game.id.toString() }
        })
    )
  }
}
