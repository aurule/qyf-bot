"use strict"

const Service = require("./default-game-scope")
const { Guilds, Games, DefaultGames } = require("../models")

const { simpleflake } = require("simpleflakes")

var channel
var game
var guild

describe("explicitScope", () => {
  beforeEach(() => {
    channel = {
      id: simpleflake().toString(),
      name: "Test Channel",
      guild: {
        id: simpleflake().toString(),
        name: "Test Guild",
      },
    }
  })

  describe("when server wide flag is true", () => {
    it("sets name to the server name", async () => {
      const results = Service.explicitScope(channel, true)

      expect(results.name).toBe("Test Guild")
    })

    it("sets scope text to the server", async () => {
      const results = Service.explicitScope(channel, true)

      expect(results.scope_text).toBe("the server")
    })

    it("sets the target type to guild", async () => {
      const results = Service.explicitScope(channel, true)

      expect(results.target_type).toBe(DefaultGames.TYPE_GUILD)
    })

    it("stores the server snowflake", async () => {
      const results = Service.explicitScope(channel, true)

      expect(results.target_snowflake).toEqual(channel.guild.id)
    })
  })

  describe("when server wide flag is false", () => {
    it("sets name to the channel name", async () => {
      const results = Service.explicitScope(channel, false)

      expect(results.name).toBe("Test Channel")
    })

    it("sets scope text to chosen channel reference", async () => {
      const results = Service.explicitScope(channel, false)

      expect(results.scope_text).toEqual(channel.name)
    })

    it("sets the target type to channel", async () => {
      const results = Service.explicitScope(channel, false)

      expect(results.target_type).toBe(DefaultGames.TYPE_CHANNEL)
    })

    it("stores the channel snowflake", async () => {
      const results = Service.explicitScope(channel, false)

      expect(results.target_snowflake).toEqual(channel.id)
    })
  })
})

describe("gameForChannel", () => {
  beforeEach(async () => {
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: simpleflake().toString()
    })
    game = await Games.create({
      name: "Test Game",
      snowflake: simpleflake().toString(),
      guildId: guild.id
    })

    channel = {
      id: simpleflake(),
      name: "Test Channel",
      guild: {
        id: game.snowflake,
        name: "Test Guild",
      },
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

  describe("channel has a default game", () => {
    it("returns the channel's game", async () => {
      const default_game = DefaultGames.create({
        gameId: game.id,
        snowflake: channel.id.toString()
      })

      const result = Service.gameForChannel(channel)

      expect(result.id).toEqual(game.id)
    })
  })

  describe("channel has no default game", () => {
    describe("topic has a default game", () => {
      it.todo("returns the topic's game")
    })

    describe("topic has no default game", () => {
      describe("server has a default game", () => {
        it.todo("returns the server's game")
      })

      describe("server has no default game", () => {
        it.todo("returns null")
      })
    })
  })
})
