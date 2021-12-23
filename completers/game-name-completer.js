const { Guilds, Games } = require("../models")
const { Op } = require("sequelize")
const { cache } = require("../util/keyv")

function cacheKey(interaction) {
  return `game-name-completer ${interaction.guildId}`
}

async function getCachedGames(interaction) {
  const cached = await cache.get(cacheKey(interaction))
  if (cached) return cached

  const data = await Games.findAll(
    {
      raw: true,
      include: {
        model: Guilds,
        attributes: [],
        where: {
          snowflake: interaction.guildId.toString()
        }
      }
    }
  )

  await cache.set(cacheKey(interaction), data)
  return data
}

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
    const data = await getCachedGames(interaction)

    return interaction.respond(
      data
        .filter((game) => game.name.toLowerCase().includes(interaction.options.getFocused()))
        .map((game) => {
          return { name: game.name, value: game.id.toString() }
        })
    )
  },
  cacheKey,
  getCachedGames,
}
