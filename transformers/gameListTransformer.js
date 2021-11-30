"use strict"

const { channelMention } = require("@discordjs/builders")
const { DefaultGames } = require("../models")

module.exports = {
  // This is meant to be called with an array of games whose query has
  // `include: DefaultGames` to avoid doing n+1 queries.
  transform: (games) => {
    return games
      .map((game) => {
        const defaults = game.DefaultGames.map((dg) => {
          if (dg.type == DefaultGames.TYPE_CHANNEL) {
            return channelMention(dg.snowflake)
          }
          return dg.name
        }).join(", ")

        const default_text = defaults ? ` (${defaults})` : ""
        return `* ${game.name}${default_text}`
      })
      .join("\n")
  },
}
