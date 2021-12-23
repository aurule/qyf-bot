"use strict"

const { channelMention } = require("@discordjs/builders")
const { DefaultGames } = require("../models")

module.exports = {
  // This is meant to be called with an array of games whose query has
  // `include: DefaultGames` to avoid doing n+1 queries.
  present: (games) => {
    return games
      .map((game) => {
        const lines = []

        const defaults = game.DefaultGames.map((dg) => {
          if (dg.type == DefaultGames.TYPE_CHANNEL) {
            return channelMention(dg.snowflake)
          }
          return dg.name
        }).join(", ")

        const default_text = defaults ? ` (${defaults})` : ""
        lines.push(`• ${game.name}${default_text}`)

        if(game.description) lines.push(`\t*${game.description}*`)

        return lines.join("\n")
      })
      .join("\n")
  },
}
