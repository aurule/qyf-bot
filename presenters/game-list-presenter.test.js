"use strict"

const { Guilds, Games, DefaultGames } = require("../models")
const { present } = require("./game-list-presenter")

const { simpleflake } = require("simpleflakes")
const {
  MessageMentions: { ChannelsPattern },
} = require("discord.js")

describe("present", () => {
  var guild

  beforeEach(async () => {
    try {
      guild = await Guilds.create({
        name: "Test Guild",
        snowflake: simpleflake().toString(),
      })
    } catch (err) {
      console.log(err)
    }
  })

  afterEach(async () => {
    try {
      const games = await Games.findAll({ where: { guildId: guild.id } })
      await DefaultGames.destroy({ where: { gameId: games.map((g) => g.id) } })
      await Games.destroy({ where: { guildId: guild.id } })
      await guild.destroy()
    } catch (err) {
      console.log(err)
    }
  })

  it("shows the name of each game", async () => {
    const game1 = await Games.create({
      name: "test game 1",
      guildId: guild.id,
    })
    const game2 = await Games.create({
      name: "test game 2",
      guildId: guild.id,
    })

    const gamesList = await Games.findAll({
      where: { guildId: guild.id },
      include: DefaultGames,
    })
    const result = present(gamesList)

    expect(result).toMatch(game1.name)
    expect(result).toMatch(game2.name)
  })

  it("shows the description of a game if present", async () => {
    const game1 = await Games.create({
      name: "test game 1",
      description: "first test game",
      guildId: guild.id,
    })
    const game2 = await Games.create({
      name: "test game 2",
      guildId: guild.id,
    })

    const gamesList = await Games.findAll({
      where: { guildId: guild.id },
      include: DefaultGames,
    })
    const result = present(gamesList)

    expect(result).toMatch(game1.description)
  })

  it("shows the server name when game is server default", async () => {
    const game = await Games.create({
      name: "test game",
      guildId: guild.id,
    })
    const defaultGame = await DefaultGames.create({
      name: guild.name,
      type: DefaultGames.TYPE_GUILD,
      gameId: game.id,
      snowflake: guild.snowflake,
    })

    const gamesList = await Games.findAll({
      where: { guildId: guild.id },
      include: DefaultGames,
    })
    const result = present(gamesList)

    expect(result).toMatch(guild.name)

    await defaultGame.destroy()
  })

  it("shows a channel reference when game is channel default", async () => {
    const game = await Games.create({
      name: "test game",
      guildId: guild.id,
    })
    const defaultGame = await DefaultGames.create({
      name: "Some Channel",
      type: DefaultGames.TYPE_CHANNEL,
      gameId: game.id,
      snowflake: simpleflake().toString(),
    })

    const gamesList = await Games.findAll({
      where: { guildId: guild.id },
      include: DefaultGames,
    })
    const result = present(gamesList)

    expect(result).toMatch(ChannelsPattern)

    await defaultGame.destroy()
  })
})
