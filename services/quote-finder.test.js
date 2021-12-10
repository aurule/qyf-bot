const QuoteFinder = require("./quote-finder")

const { Quotes, Lines, Games, Users } = require("../models")

const { Op } = require("sequelize");

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
  it.todo("x")
})
