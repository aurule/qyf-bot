"use strict"

const QuoteBuilder = require("./quote-builder")

const { Guilds, Games, Quotes, Lines, Users } = require("../models")
const { simpleflake } = require("simpleflakes")
const { logger } = require("../util/logger")

describe("QuoteData", () => {
  describe("constructor", () => {
    const options = {
      text: "test text",
      attribution: "some guy",
      speaker: {
        id: 1,
        username: "That Guy",
        something: "else",
        another: "thing",
      },
    }

    it("saves text as-is", () => {
      const data = new QuoteBuilder.QuoteData(options)

      expect(data.text).toEqual(options.text)
    })

    it("saves attribution as-is", () => {
      const data = new QuoteBuilder.QuoteData(options)

      expect(data.attribution).toEqual(options.attribution)
    })

    it("saves only the id and username of speaker", () => {
      const data = new QuoteBuilder.QuoteData(options)

      const expected_user = {
        id: "1",
        username: "That Guy",
      }

      expect(data.speaker).toEqual(expected_user)
    })
  })
})

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
    const quoter_ids = quotes.map((q) => q.quoterId)

    await Lines.destroy({ where: { quoteId: quote_ids } })
    await Users.destroyByPk(speaker_ids)
    await Quotes.destroy({ where: { gameId: game_ids } })
    await Users.destroyByPk(quoter_ids)
    await game.destroy()
    await guild.destroy()
  })

  describe("speaker", () => {
    it("assigns an existing speaker", async () => {
      const user = await Users.create({
        name: "Test Speaker",
        snowflake: simpleflake().toString(),
      })

      const discord_user = {
        username: "New Name",
        id: user.snowflake,
      }

      const quote = await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: discord_user,
      })

      expect(await user.countLines()).toEqual(1)
    })

    it("creates a new speaker", async () => {
      const speaker = {
        username: "Test Speaker",
        id: simpleflake(),
      }

      const quote = await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: speaker,
      })

      const user = await Users.findOne({
        where: { snowflake: speaker.id.toString() },
      })

      expect(user).toBeTruthy()
    })
  })

  describe("quoter", () => {
    var speaker
    var speaker_user

    beforeEach(async () => {
      speaker_user = await Users.create({
        name: "Test Speaker",
        snowflake: simpleflake().toString(),
      })

      speaker = {
        username: "New Name",
        id: speaker_user.snowflake,
      }
    })

    it("assigns an existing quoter", async () => {
      const quoter_user = await Users.create({
        name: "Test Quoter",
        snowflake: simpleflake().toString(),
      })

      const quoter = {
        username: "New Name",
        id: quoter_user.snowflake,
      }

      const quote = await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: speaker,
        quoter: quoter,
      })

      expect(await quoter_user.countQuotes()).toEqual(1)
    })

    it("creates a new quoter", async () => {
      const quoter = {
        username: "Test Quoter",
        id: simpleflake(),
      }

      const quote = await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: speaker,
        quoter: quoter,
      })

      const user = await Users.findOne({
        where: { snowflake: quoter.id.toString() },
      })

      expect(user).toBeTruthy()
    })
  })

  it("creates a new Quote for the game", async () => {
    const user = await Users.create({
      name: "Test Speaker",
      snowflake: simpleflake().toString(),
    })

    const speaker = {
      username: "New Name",
      id: user.snowflake,
    }

    const quote = await QuoteBuilder.makeQuote({
      text: "test text",
      attribution: "some guy",
      game: game,
      speaker: speaker,
    })

    expect(quote).toBeTruthy()
  })

  describe("creates a new line", () => {
    let speaker
    let user

    beforeEach(async () => {
      user = await Users.create({
        name: "Test Speaker",
        snowflake: simpleflake().toString(),
      })

      speaker = {
        username: "New Name",
        id: user.snowflake,
      }
    })

    it("stores the text", async () => {
      const quote = await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: speaker,
      })

      const lines = await quote.getLines()

      expect(lines[0].content).toMatch("test text")
    })

    it("uses the speaker object", async () => {
      const quote = await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: speaker,
      })

      const lines = await quote.getLines()

      expect(lines[0].speakerId).toEqual(user.id)
    })

    it("sets the alias to attribution text", async () => {
      const quote = await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: speaker,
      })

      const lines = await quote.getLines()

      expect(lines[0].speakerAlias).toMatch("some guy")
    })

    it("sets lineOrder to zero", async () => {
      const quote = await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: speaker,
      })

      const lines = await quote.getLines()

      expect(lines[0].lineOrder).toEqual(0)
    })
  })

  it("logs any errors", async () => {
    const user = await Users.create({
      name: "Test Speaker",
      snowflake: simpleflake().toString(),
    })

    const speaker = {
      username: "New Name",
      id: user.snowflake,
    }

    jest.spyOn(Quotes, "create").mockImplementation((...options) => {
      throw new Error("test error")
    })
    const loggerSpy = jest.spyOn(logger, "warn")

    const result = await QuoteBuilder.makeQuote({
      text: "test text",
      attribution: "some guy",
      game: game,
      speaker: user,
    })

    expect(loggerSpy).toHaveBeenCalled()
    expect(result).toBeNull()
  })
})
