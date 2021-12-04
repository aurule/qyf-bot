"use strict"

const QuoteBuilder = require("./quote-builder")

const { Guilds, Games, Quotes, Lines, Speakers } = require("../models")
const { simpleflake } = require("simpleflakes")

describe("makeQuote", () => {
  var guild
  var game

  beforeEach(async () => {
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: simpleflake().toString(),
    })
    game = await Games.create({
      name: "Test Game",
      guildId: guild.id,
    })
  })

  afterEach(async () => {
    const games = await Games.findAll({ where: { guildId: guild.id } })
    const game_ids = games.map((g) => g.id)
    const quotes = await Quotes.findAll({ where: { gameId: game_ids } })
    const quote_ids = quotes.map((q) => q.id)
    const lines = await Lines.findAll({ where: { quoteId: quote_ids } })
    const speaker_ids = lines.map((line) => line.speakerId)

    await Lines.destroy({ where: { quoteId: quote_ids } })
    await Speakers.destroy({ where: { id: speaker_ids } })
    await Quotes.destroy({ where: { gameId: game_ids } })
    await game.destroy()
    await guild.destroy()
  })

  it("assigns an existing speaker", async () => {
    const speaker = await Speakers.create({
      name: "Test Speaker",
      snowflake: simpleflake().toString(),
    })

    const user = {
      username: "New Name",
      id: speaker.snowflake,
    }

    const quote = await QuoteBuilder.makeQuote(
      "test text",
      "some guy",
      game,
      user
    )

    expect(await speaker.countLines()).toEqual(1)
  })

  it("creates a new speaker", async () => {
    const user = {
      username: "Test Speaker",
      id: simpleflake(),
    }

    const quote = await QuoteBuilder.makeQuote(
      "test text",
      "some guy",
      game,
      user
    )

    const speaker = await Speakers.findOne({
      where: { snowflake: user.id.toString() },
    })

    expect(speaker).toBeTruthy()
  })

  it.todo("creates a new Quote for the game")
  describe("creates a new line", () => {
    it.todo("stores the text")
    it.todo("uses the speaker object")
    it.todo("sets the alias to attribution text")
    it.todo("sets lineOrder to zero")
  })
})
