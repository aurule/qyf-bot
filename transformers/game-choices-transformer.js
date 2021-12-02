"use strict"

module.exports = {
  /**
   * Transforms a collection of games into an array of label/value pairs
   * suitable for the choices of a Discord integeter option
   * @param  {Collection} games The games to transform
   * @return {Array[Array]}       Array of option choices
   */
  transform: (games) => {
    return games.map((game) => {
      return [game.name, game.id]
    })
  },
}
