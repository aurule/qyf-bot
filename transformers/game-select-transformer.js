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
      let optionData = {
        label: game.name,
        value: game.id.toString(),
      }

      if(game.description) optionData.description = game.description

      return optionData
    })
  },
}
