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
      context: "some context"
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

    it("saves context as-is", () => {
      const data = new QuoteBuilder.QuoteData(options)

      expect(data.context).toEqual(options.context)
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
    await Quotes.destroy({ where: { gameId: game_ids } })
    await Users.destroyByPk(speaker_ids)
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

      await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: discord_user,
        quoter: discord_user,
      })

      expect(await user.countLines()).toEqual(1)
    })

    it("creates a new speaker", async () => {
      const speaker = {
        username: "Test Speaker",
        id: simpleflake(),
      }

      await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: speaker,
        quoter: speaker,
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

      await QuoteBuilder.makeQuote({
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

      await QuoteBuilder.makeQuote({
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

    it("with no quoter, logs a warning", async () => {
      const logSpy = jest.spyOn(logger, "warn")

      await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: speaker,
      })

      expect(logSpy).toHaveBeenCalled()
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
      quoter: speaker,
      context: "some context!",
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
        quoter: speaker,
      })

      expect(quote.Lines[0].content).toMatch("test text")
    })

    it("uses the speaker object", async () => {
      const quote = await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: speaker,
        quoter: speaker,
      })

      expect(quote.Lines[0].speakerId).toEqual(user.id)
    })

    it("sets the alias to attribution text", async () => {
      const quote = await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: speaker,
        quoter: speaker,
      })


      expect(quote.Lines[0].speakerAlias).toMatch("some guy")
    })

    it("sets lineOrder to zero", async () => {
      const quote = await QuoteBuilder.makeQuote({
        text: "test text",
        attribution: "some guy",
        game: game,
        speaker: speaker,
        quoter: speaker,
      })

      expect(quote.Lines[0].lineOrder).toEqual(0)
    })
  })
})

describe("addLine", () => {
  var guild
  var game
  var quote
  var speaker
  var quoter

  beforeEach(async () => {
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: simpleflake().toString(),
    })
    game = await Games.create({
      name: "Test Game",
      guildId: guild.id,
    })
    speaker = await Users.create({
      name: "Test Speaker",
      snowflake: simpleflake().toString(),
    })
    quoter = await Users.create({
      name: "Test Quoter",
      snowflake: simpleflake().toString(),
    })
    quote = await Quotes.create({
      quoterId: quoter.id,
      gameId: game.id,
      saidAt: Date.now(),
    })
    quote.createLine({
      content: "The first line",
      speakerId: speaker.id,
      speakerAlias: "Some Guy",
      lineOrder: 0,
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
      const discord_user = {
        username: "New Name",
        id: speaker.snowflake,
      }

      await QuoteBuilder.addLine({
        text: "test text",
        attribution: "some guy",
        speaker: discord_user,
        quoter: discord_user,
        quote: quote,
      })

      expect(await speaker.countLines()).toEqual(2)
    })

    it("creates a new speaker", async () => {
      const discord_user = {
        username: "Test Speaker 2",
        id: simpleflake(),
      }

      await QuoteBuilder.addLine({
        text: "test text",
        attribution: "some guy",
        speaker: discord_user,
        quote: quote,
      })

      const user = await Users.findOne({
        where: { snowflake: discord_user.id.toString() },
      })

      expect(user).toBeTruthy()
    })
  })

  describe("creates a new line", () => {
    let speaker_user

    beforeEach(() => {
      speaker_user = {
        username: speaker.name,
        id: speaker.snowflake,
      }
    })

    it("stores the text", async () => {
      await QuoteBuilder.addLine({
        text: "test text",
        attribution: "some guy",
        speaker: speaker_user,
        quote: quote,
      })

      const lines = await quote.getLines()

      expect(lines[1].content).toMatch("test text")
    })

    it("uses the speaker object", async () => {
      await QuoteBuilder.addLine({
        text: "test text",
        attribution: "some guy",
        speaker: speaker_user,
        quote: quote,
      })

      const lines = await quote.getLines()

      expect(lines[1].speakerId).toEqual(speaker.id)
    })

    it("sets the alias to attribution text", async () => {
      await QuoteBuilder.addLine({
        text: "test text",
        attribution: "some guy",
        speaker: speaker_user,
        quote: quote,
      })

      const lines = await quote.getLines()

      expect(lines[1].speakerAlias).toMatch("some guy")
    })

    it("sets lineOrder to zero", async () => {
      await QuoteBuilder.addLine({
        text: "test text",
        attribution: "some guy",
        speaker: speaker_user,
        quote: quote,
      })

      const lines = await quote.getLines()

      expect(lines[1].lineOrder).toEqual(1)
    })
  })
})
