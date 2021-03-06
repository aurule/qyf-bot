"use strict"

module.exports = {
  /**
   * Transforms a collection of games into an array of label/value objects
   * suitable for use in a Discord select menu interaction reply.
   * @param  {Collection} games The games to transform
   * @return {Array[Obj]}       Array of select menu option objects
   */
  transform: (games) => {
    return games.map((game) => {
      return {
        label: game.name,
        description: game.description,
        value: game.id.toString(),
      }
    })
  },
}
