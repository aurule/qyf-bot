"use strict"

module.exports = {
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
