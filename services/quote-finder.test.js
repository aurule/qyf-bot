const QuoteFinder = require("./quote-finder")

const { Quotes, Lines, Games, Users, Guilds } = require("../models")

const { Op } = require("sequelize");
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
      const opts = new QuoteFinder.SearchOptions({userId: 1})

      expect(opts.userId).toEqual([1])
    })

    it("preserves an array of userIds", () => {
      const user_ids = [1, 2, 3, 4, 5]
      const opts = new QuoteFinder.SearchOptions({userId: user_ids})

      expect(opts.userId).toEqual(user_ids)
    })

    it("forces a single gameId into an array", () => {
      const opts = new QuoteFinder.SearchOptions({gameId: 1})

      expect(opts.gameId).toEqual([1])
    })

    it("preserves an array of gameIds", () => {
      const game_ids = [1, 2, 3, 4, 5]
      const opts = new QuoteFinder.SearchOptions({gameId: game_ids})

      expect(opts.gameId).toEqual(game_ids)
    })

    it("populates the alias", () => {
      const opts = new QuoteFinder.SearchOptions({alias: "Someone"})

      expect(opts.alias).toEqual("Someone")
    })

    it("populates the guild", () => {
      const fake_guild = {id: 1, name: "fake guild"}
      const opts = new QuoteFinder.SearchOptions({guild: fake_guild})

      expect(opts.guild).toEqual(fake_guild)
    })

    it("populates the speaker", () => {
      const opts = new QuoteFinder.SearchOptions({speaker: "something"})

      expect(opts.speaker).toEqual("something")
    })
  })

  describe("build", () => {
    it("always includes Lines and Games models", () => {
      const opts = new QuoteFinder.SearchOptions()

      const result = opts.build()

      expect(result).toMatchObject({
        include: [
          {
            model: Games
          },
          {
            model: Lines,
          },
        ]
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
      const opts = new QuoteFinder.SearchOptions({gameId: 1})

      const result = opts.build()

      expect(result.where).toMatchObject({gameId: [1]})
    })

    it("with guild, adds where clause at game level", () => {
      const opts = new QuoteFinder.SearchOptions({guild: {id: 1}})

      const result = opts.build()

      expect(result.include[0].where).toMatchObject({guildId: 1})
    })

    it("with userId, adds where clause at lines level", () => {
      const opts = new QuoteFinder.SearchOptions({userId: 1})

      const result = opts.build()

      expect(result.include[1].where).toMatchObject({speakerId: [1]})
    })

    it("with alias, adds where clause at lines level", () => {
      const opts = new QuoteFinder.SearchOptions({alias: "something"})

      const result = opts.build()

      expect(result.include[1].where).toMatchObject({[Op.like]: "something"})
    })

    it("with speaker, adds include and where at lines level", () => {
      const opts = new QuoteFinder.SearchOptions({speaker: "snowflake"})

      const result = opts.build()

      expect(result.include[1].include).toMatchObject({
        model: Users,
        where: {
          snowflake: "snowflake"
        }
      })
    })
  })
})

describe("findAll", () => {
  let main_guild
  let game1
  let game2
  let speaker_quote
  let game_quote
  let user_quote
  let alias_quote

  let other_guild
  let other_game
  let guild_quote

  beforeAll(async () => {
    try {
      main_guild = await Guilds.create({name: "Test Guild", snowflake: simpleflake().toString()})
      game1 = await Games.create({name: "Test Game 1", guildId: main_guild.id})
      game2 = await Games.create({name: "Test Game 2", guildId: main_guild.id})
      game_quote = await Quotes.create({gameId: game2.id})
      speaker = await Users.create({name: "Speaker", snowflake: simpleflake().toString()})
      speaker_quote = await Quotes.create({gameId: game1.id, Lines: [{speakerId: speaker.id}], include: Lines})
      user = await Users.create({name: "User", snowflake: simpleflake().toString()})
      user_quote = await Quotes.create({gameId: game1.id, Lines: [{speakerId: speaker.id}], include: Lines})
      alias_quote = await Quotes.create({gameId: game1.id, Lines: [{speakerAlias: "Alias"}], include: Lines})

      other_guild = await Guilds.create({name: "Other Test Guild", snowflake: simpleflake().toString()})
      other_game = await Games.create({name: "Other Test Game", guildId: other_guild.id})
      guild_quote = await Quotes.create({gameId: other_game.id})
    } catch (err) {
      console.log(err)
    }
  })

  afterAll(async () => {
    const quote_ids = [
      game_quote.id,
      speaker_quote.id,
      user_quote.id,
      alias_quote.id,
      guild_quote.id,
    ]
    await Lines.destroy({where: {quoteId: quote_ids}})
    await Quotes.destroyByPk(quote_ids)

    await Users.destroyByPk([speaker.id, user.id])

    await Games.destroyByPk([game1.id, game2.id, other_game.id])

    await Guilds.destroyByPk([main_guild.id, other_game.id])
  })

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
    const opts = new QuoteFinder.SearchOptions({gameId: game2.id})

    const result = await QuoteFinder.findAll(opts)
    const result_ids = result.map((quote) => quote.id)

    expect(result_ids).toEqual([game_quote.id])
  })

  it("with a guild, returns the quote from the guild", async () => {
    const opts = new QuoteFinder.SearchOptions({guild: other_guild})

    const result = await QuoteFinder.findAll(opts)
    const result_ids = result.map((quote) => quote.id)

    expect(result_ids).toEqual([guild_quote.id])
  })

  it("with a speaker, returns the quote where the speaker is associated with a line", async () => {
    const opts = new QuoteFinder.SearchOptions({speaker: speaker.snowflake})

    const result = await QuoteFinder.findAll(opts)
    const result_ids = result.map((quote) => quote.id)

    expect(result_ids).toEqual([speaker_quote.id])
  })

  it("with a user, returns the quote where the user is associated with a line", async () => {
    const opts = new QuoteFinder.SearchOptions({userId: user.id})

    const result = await QuoteFinder.findAll(opts)
    const result_ids = result.map((quote) => quote.id)

    expect(result_ids).toEqual([user_quote.id])
  })

  it("with an alias, returns the quote where a line's attribution matches the alias text", async () => {
    const opts = new QuoteFinder.SearchOptions({alias: "lia"})

    const result = await QuoteFinder.findAll(opts)
    const result_ids = result.map((quote) => quote.id)

    expect(result_ids).toEqual([alias_quote.id])
  })
})
