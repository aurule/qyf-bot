const { Guilds, Games } = require("../models")
const { cache } = require("../util/keyv")

module.exports = {
  /**
   * Get the cache key for a guild snowflake
   * @param  {String} snowflake The guild snowflake to use for the key
   * @return {String}           The cache key for the given snowflake
   */
  key(snowflake) {
      return `games-for-guild ${snowflake}`
  },

  /**
   * Get all the attributes of games whose guild has the given snowflake
   * @param  {String}         snowflake The snowflake of the guild whose games should be fetched
   * @return {Promise<Array<Object>>}            Array of plain objects containing attributes of the guild's games
   */
  async get(snowflake) {
    const cached = await cache.get(module.exports.key(snowflake))
    if (cached) return cached

    const data = await Games.findAll(
      {
        raw: true,
        include: {
          model: Guilds,
          attributes: [],
          where: {
            snowflake: snowflake
          }
        }
      }
    )

    await cache.set(snowflake, data)
    return data
  }
}
