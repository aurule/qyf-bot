const QuoteFinder = require("./quote-finder")

const { Quotes, Lines, Games, Users, Guilds } = require("../models")

const { Op } = require("sequelize")
const { simpleflake } = require("simpleflakes")

describe("SearchOptions", () => {
  describe("constructor", () => {
    it("leaves everything undefined by default", () => {
      const opts = new QuoteFinder.SearchOptions()

      expect(opts.speaker).toEqual(undefined)
      expect(opts.userId).toEqual(undefined)
      expect(opts.gameId).toEqual(undefined)
      expect(opts.alias).toEqual(undefined)
      expect(opts.guild).toEqual(undefined)
    })

    it("forces a single userId into an array", () => {
      const opts = new QuoteFinder.SearchOptions({ userId: 1 })

      expect(opts.userId).toEqual([1])
    })

    it("preserves an array of userIds", () => {
      const user_ids = [1, 2, 3, 4, 5]
      const opts = new QuoteFinder.SearchOptions({ userId: user_ids })

      expect(opts.userId).toEqual(user_ids)
    })

    it("forces a single gameId into an array", () => {
      const opts = new QuoteFinder.SearchOptions({ gameId: 1 })

      expect(opts.gameId).toEqual([1])
    })

    it("preserves an array of gameIds", () => {
      const game_ids = [1, 2, 3, 4, 5]
      const opts = new QuoteFinder.SearchOptions({ gameId: game_ids })

      expect(opts.gameId).toEqual(game_ids)
    })

    it("populates the alias", () => {
      const opts = new QuoteFinder.SearchOptions({ alias: "Someone" })

      expect(opts.alias).toEqual("Someone")
    })

    it("populates the guild", () => {
      const fake_guild = { id: 1, name: "fake guild" }
      const opts = new QuoteFinder.SearchOptions({ guild: fake_guild })

      expect(opts.guild).toEqual(fake_guild)
    })

    it("populates the speaker", () => {
      const opts = new QuoteFinder.SearchOptions({ speaker: "something" })

      expect(opts.speaker).toEqual("something")
    })

    it("populates the text", () => {
      const opts = new QuoteFinder.SearchOptions({ text: "Text" })

      expect(opts.text).toEqual("Text")
    })
  })

  describe("build", () => {
    it("always includes Lines and Games models", () => {
      const opts = new QuoteFinder.SearchOptions()

      const result = opts.build()

      expect(result).toMatchObject({
        include: [
          {
            model: Games,
          },
          {
            model: Lines,
          },
        ],
      })
    })

    it("with no data, adds no where clauses", () => {
      const opts = new QuoteFinder.SearchOptions()

      const result = opts.build()

      expect(result.where).toEqual({})
      expect(result.include[0].where).toEqual({})
      expect(result.include[1].where).toEqual({})
    })

    it("with gameId, adds where clause at quote level", () => {
      const opts = new QuoteFinder.SearchOptions({ gameId: 1 })

      const result = opts.build()

      expect(result.where).toMatchObject({ gameId: [1] })
    })

    it("with guild, adds where clause at game level", () => {
      const opts = new QuoteFinder.SearchOptions({ guild: { id: 1 } })

      const result = opts.build()

      expect(result.include[0].where).toMatchObject({ guildId: 1 })
    })

    it("with userId, adds where clause at lines level", () => {
      const opts = new QuoteFinder.SearchOptions({ userId: 1 })

      const result = opts.build()

      expect(result.include[1].where).toMatchObject({ speakerId: [1] })
    })

    it("with alias, adds where clause at lines level", () => {
      const opts = new QuoteFinder.SearchOptions({ alias: "something" })

      const result = opts.build()

      expect(result.include[1].where).toMatchObject({ [Op.like]: "something" })
    })

    it("with text, adds where clause at lines level", () => {
      const opts = new QuoteFinder.SearchOptions({ text: "text" })

      const result = opts.build()

      expect(result.include[1].where).toMatchObject({ [Op.like]: "text" })
    })

    it("with speaker, adds include and where at lines level", () => {
      const opts = new QuoteFinder.SearchOptions({ speaker: "snowflake" })

      const result = opts.build()

      expect(result.include[1].include).toMatchObject({
        model: Users,
        where: {
          snowflake: "snowflake",
        },
      })
    })
  })
})

describe("finders", () => {
  let main_guild
  let main_game
  let game2
  let speaker
  let speaker_quote
  let quoter
  let quoter_quote
  let game_quote
  let user_quote
  let alias_quote
  let lines_quote

  let other_guild
  let other_game
  let guild_quote

  beforeAll(async () => {
    try {
      main_guild = await Guilds.create({
        name: "Test Guild",
        snowflake: simpleflake().toString(),
      })
      main_game = await Games.create({
        name: "Test Game 1",
        guildId: main_guild.id,
      })
      game2 = await Games.create({
        name: "Test Game 2",
        guildId: main_guild.id,
      })
      game_quote = await Quotes.create(
        { gameId: game2.id, Lines: [{ content: "game said", lineOrder: 0 }] },
        { include: Lines }
      )
      speaker = await Users.create({
        name: "Speaker",
        snowflake: simpleflake().toString(),
      })
      speaker_quote = await Quotes.create(
        {
          gameId: main_game.id,
          Lines: [
            { content: "speaker said", speakerId: speaker.id, lineOrder: 0 },
          ],
        },
        { include: Lines }
      )
      quoter = await Users.create({
        name: "Quoter",
        snowflake: simpleflake().toString(),
      })
      quoter_quote = await Quotes.create(
        {
          gameId: main_game.id,
          quoterId: quoter.id,
          Lines: [{ content: "quoter said", lineOrder: 0 }],
        },
        { include: Lines }
      )
      user = await Users.create({
        name: "User",
        snowflake: simpleflake().toString(),
      })
      user_quote = await Quotes.create(
        {
          gameId: main_game.id,
          Lines: [{ content: "user said", speakerId: user.id, lineOrder: 0 }],
        },
        { include: Lines }
      )
      alias_quote = await Quotes.create(
        {
          gameId: main_game.id,
          Lines: [
            { content: "alias said", speakerAlias: "Alias", lineOrder: 0 },
          ],
        },
        { include: Lines }
      )
      text_quote = await Quotes.create(
        {
          gameId: main_game.id,
          Lines: [{ content: "specific text", lineOrder: 0 }],
        },
        { include: Lines }
      )
      lines_quote = await Quotes.create(
        {
          gameId: main_game.id,
          Lines: [
            {
              content: "lines quote text 1",
              lineOrder: 0,
            },
            { content: "lines quote text 2", lineOrder: 1 },
            { content: "lines quote text 3", lineOrder: 2 },
          ],
        },
        { include: Lines }
      )

      other_guild = await Guilds.create({
        name: "Other Test Guild",
        snowflake: simpleflake().toString(),
      })
      other_game = await Games.create({
        name: "Other Test Game",
        guildId: other_guild.id,
      })
      guild_quote = await Quotes.create(
        {
          gameId: other_game.id,
          Lines: [{ content: "guild said", lineOrder: 0 }],
        },
        { include: Lines }
      )
    } catch (err) {
      console.log(err)
    }
  })

  afterAll(async () => {
    const quote_ids = [
      game_quote.id,
      speaker_quote.id,
      quoter_quote.id,
      user_quote.id,
      alias_quote.id,
      guild_quote.id,
      text_quote.id,
      lines_quote.id,
    ]
    await Lines.destroy({ where: { quoteId: quote_ids } })
    await Quotes.destroyByPk(quote_ids)

    await Users.destroyByPk([speaker.id, user.id, quoter.id])

    await Games.destroyByPk([main_game.id, game2.id, other_game.id])

    await Guilds.destroyByPk([main_guild.id, other_game.id])
  })

  describe("findAll", () => {
    it("with no options, returns all quotes", async () => {
      const opts = new QuoteFinder.SearchOptions()

      const result = await QuoteFinder.findAll(opts)
      const result_ids = result.map((quote) => quote.id)

      expect(result_ids).toEqual(
        expect.arrayContaining([
          game_quote.id,
          speaker_quote.id,
          user_quote.id,
          alias_quote.id,
          guild_quote.id,
        ])
      )
    })

    it("with a game, returns the quote from that game", async () => {
      const opts = new QuoteFinder.SearchOptions({ gameId: game2.id })

      const result = await QuoteFinder.findAll(opts)
      const result_ids = result.map((quote) => quote.id)

      expect(result_ids).toEqual([game_quote.id])
    })

    it("with a guild, returns the quote from the guild", async () => {
      const opts = new QuoteFinder.SearchOptions({ guild: other_guild })

      const result = await QuoteFinder.findAll(opts)
      const result_ids = result.map((quote) => quote.id)

      expect(result_ids).toEqual([guild_quote.id])
    })

    it("with a speaker, returns the quote where the speaker is associated with a line", async () => {
      const opts = new QuoteFinder.SearchOptions({ speaker: speaker.snowflake })

      const result = await QuoteFinder.findAll(opts)
      const result_ids = result.map((quote) => quote.id)

      expect(result_ids).toEqual([speaker_quote.id])
    })

    it("with a user, returns the quote where the user is associated with a line", async () => {
      const opts = new QuoteFinder.SearchOptions({ userId: user.id })

      const result = await QuoteFinder.findAll(opts)
      const result_ids = result.map((quote) => quote.id)

      expect(result_ids).toEqual([user_quote.id])
    })

    it("with an alias, returns the quote where a line's attribution matches the alias text", async () => {
      const opts = new QuoteFinder.SearchOptions({ alias: "lia" })

      const result = await QuoteFinder.findAll(opts)
      const result_ids = result.map((quote) => quote.id)

      expect(result_ids).toEqual([alias_quote.id])
    })

    it("with text, returns the quote where a line's content matches the text", async () => {
      const opts = new QuoteFinder.SearchOptions({ text: "specific" })

      const result = await QuoteFinder.findAll(opts)
      const result_ids = result.map((quote) => quote.id)

      expect(result_ids).toEqual([text_quote.id])
    })

    it("with a speaker, game, and guild, it finds the right quote with a limit", async () => {
      // THIS FUNCTIONALITY DOES NOT WORK
      //
      // When there is no limit option, it works fine. As soon as there is a limit (regardless of
      // the presence of the default order option), sequelize generates faulty sql which throws a
      // `SQLITE_ERROR: no such column: Lines.speakerId` error. The column Lines.speakerId is for
      // some reason not found within a subquery. Until Sequelize is fixed, it is impossible to use
      // this querier to find a limited number of quotes from a speaker by snowflake.
      const opts = new QuoteFinder.SearchOptions({
        speaker: speaker.snowflake,
        gameId: [main_game.id],
        alias: null,
        text: null,
        guild: main_guild,
      })

      var result

      try {
        result = await QuoteFinder.findAll(opts, { limit: 5 })
        const result_ids = result.map((quote) => quote.id)

        expect(result_ids).toEqual([speaker_quote.id])
      } catch (error) {
        // console.log(error)
      }

      expect(result).toBeFalsy()
    })
  })

  describe("count", () => {
    it("with the main guild, counts all of its quotes", async () => {
      const opts = new QuoteFinder.SearchOptions({ guild: main_guild })

      const result = await QuoteFinder.count(opts)

      expect(result).toEqual(7)
    })

    it("with a game, counts the quote from that game", async () => {
      const opts = new QuoteFinder.SearchOptions({ gameId: game2.id })

      const result = await QuoteFinder.count(opts)

      expect(result).toEqual(1)
    })

    it("with a guild, counts the quote from the guild", async () => {
      const opts = new QuoteFinder.SearchOptions({ guild: other_guild })

      const result = await QuoteFinder.count(opts)

      expect(result).toEqual(1)
    })

    it("with a speaker, counts the quote where the speaker is associated with a line", async () => {
      const opts = new QuoteFinder.SearchOptions({ speaker: speaker.snowflake })

      const result = await QuoteFinder.count(opts)

      expect(result).toEqual(1)
    })

    it("with a user, counts the quote where the user is associated with a line", async () => {
      const opts = new QuoteFinder.SearchOptions({ userId: user.id })

      const result = await QuoteFinder.count(opts)

      expect(result).toEqual(1)
    })

    it("with an alias, counts the quote where a line's attribution matches the alias text", async () => {
      const opts = new QuoteFinder.SearchOptions({ alias: "lia" })

      const result = await QuoteFinder.count(opts)

      expect(result).toEqual(1)
    })

    it("with text, counts the quote where a line's content matches the text", async () => {
      const opts = new QuoteFinder.SearchOptions({ text: "specific" })

      const result = await QuoteFinder.count(opts)

      expect(result).toEqual(1)
    })
  })

  describe("findAndCountall", () => {
    it("with no options, returns all quotes", async () => {
      const opts = new QuoteFinder.SearchOptions()

      const result = await QuoteFinder.findAndCountAll(opts)
      const result_ids = result.rows.map((quote) => quote.id)

      expect(result_ids).toEqual(
        expect.arrayContaining([
          game_quote.id,
          speaker_quote.id,
          user_quote.id,
          alias_quote.id,
          guild_quote.id,
          alias_quote.id,
          text_quote.id,
        ])
      )
      // we don't test the count here because the results are sometimes polluted by other tests
      // running in parallel
    })

    it("with a game, returns the quote from that game", async () => {
      const opts = new QuoteFinder.SearchOptions({ gameId: game2.id })

      const result = await QuoteFinder.findAndCountAll(opts)
      const result_ids = result.rows.map((quote) => quote.id)

      expect(result_ids).toEqual([game_quote.id])
      expect(result.count).toEqual(1)
    })

    it("with a guild, returns the quote from the guild", async () => {
      const opts = new QuoteFinder.SearchOptions({ guild: other_guild })

      const result = await QuoteFinder.findAndCountAll(opts)
      const result_ids = result.rows.map((quote) => quote.id)

      expect(result_ids).toEqual([guild_quote.id])
      expect(result.count).toEqual(1)
    })

    it("with a speaker, returns the quote where the speaker is associated with a line", async () => {
      const opts = new QuoteFinder.SearchOptions({ speaker: speaker.snowflake })

      const result = await QuoteFinder.findAndCountAll(opts)
      const result_ids = result.rows.map((quote) => quote.id)

      expect(result_ids).toEqual([speaker_quote.id])
      expect(result.count).toEqual(1)
    })

    it("with a user, returns the quote where the user is associated with a line", async () => {
      const opts = new QuoteFinder.SearchOptions({ userId: user.id })

      const result = await QuoteFinder.findAndCountAll(opts)
      const result_ids = result.rows.map((quote) => quote.id)

      expect(result_ids).toEqual([user_quote.id])
      expect(result.count).toEqual(1)
    })

    it("with an alias, returns the quote where a line's attribution matches the alias text", async () => {
      const opts = new QuoteFinder.SearchOptions({ alias: "lia" })

      const result = await QuoteFinder.findAndCountAll(opts)
      const result_ids = result.rows.map((quote) => quote.id)

      expect(result_ids).toEqual([alias_quote.id])
      expect(result.count).toEqual(1)
    })

    it("with text, returns the quote where a line's content matches the text", async () => {
      const opts = new QuoteFinder.SearchOptions({ text: "specific" })

      const result = await QuoteFinder.findAndCountAll(opts)
      const result_ids = result.rows.map((quote) => quote.id)

      expect(result_ids).toEqual([text_quote.id])
      expect(result.count).toEqual(1)
    })
  })

  describe("findOne", () => {
    it("returns a single quote", async () => {
      const opts = new QuoteFinder.SearchOptions()

      const result = await QuoteFinder.findOne(opts)

      expect(result instanceof Quotes).toEqual(true)
    })

    it("with a speaker, game, and guild, it finds the right quote with an order", async () => {
      // THIS FUNCTIONALITY DOES NOT WORK
      //
      // When there is no order option, it works fine. As soon as there is an order, sequelize
      // generates faulty sql which throws a `SQLITE_ERROR: no such column: Lines.speakerId` error.
      // The column Lines.speakerId is for some reason not found within a subquery. Until Sequelize
      // is fixed, it is impossible to use this querier to find a limited number of quotes from a
      // speaker by snowflake.
      const opts = new QuoteFinder.SearchOptions({
        speaker: speaker.snowflake,
        gameId: [main_game.id],
        alias: null,
        text: null,
        guild: main_guild,
      })

      var result

      try {
        result = await QuoteFinder.findOne(opts, {
          order: [["saidAt", "DESC"]],
        })
        const result_ids = result.map((quote) => quote.id)

        expect(result_ids).toEqual([speaker_quote.id])
      } catch (error) {
        // console.log(error)
      }

      expect(result).toBeFalsy()
    })
  })

  describe("findLastEditable", () => {
    var discord_quoter

    beforeEach(() => {
      discord_quoter = {
        id: quoter.snowflake,
      }
    })

    it("gets the quoter's quote", async () => {
      const result = await QuoteFinder.findLastEditable(discord_quoter)

      expect(result.id).toEqual(quoter_quote.id)
    })

    describe("with a newer quote", () => {
      var newest_quote

      beforeEach(async () => {
        newest_quote = await Quotes.create({
          quoterId: quoter.id,
          gameId: main_game.id,
        })
      })

      afterEach(async () => {
        await newest_quote.destroy()
      })

      it("gets the most recent quote", async () => {
        const result = await QuoteFinder.findLastEditable(discord_quoter)

        expect(result.id).toEqual(newest_quote.id)
      })
    })
  })
})
