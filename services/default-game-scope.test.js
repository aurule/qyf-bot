"use strict"

const Service = require("./default-game-scope")
const { Guilds, Games, DefaultGames } = require("../models")

const { simpleflake } = require("simpleflakes")

var channel
var game
var guild

describe("DefaultGameScope", () => {
  beforeEach(() => {
    channel = {
      id: simpleflake().toString(),
      name: "Test Channel",
      guild: {
        id: simpleflake().toString(),
        name: "Test Guild",
      },
      isThread: () => false,
    }
  })

  describe("scopeMention", () => {
    it("returns plain text as a server scope", () => {
      const scope = Service.explicitScope(channel, true)

      expect(scope.scopeMention()).toEqual("the server")
    })

    it("returns a channel mention as a channel scope", () => {
      const scope = Service.explicitScope(channel, false)

      expect(scope.scopeMention()).toMatch(channel.id.toString())
    })
  })
})

describe("explicitScope", () => {
  beforeEach(() => {
    channel = {
      id: simpleflake().toString(),
      name: "Test Channel",
      guild: {
        id: simpleflake().toString(),
        name: "Test Guild",
      },
      isThread: () => false,
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
  let default_game

  beforeEach(async () => {
    const serverId = simpleflake()
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: serverId.toString(),
    })
    game = await Games.create({
      name: "Test Game",
      guildId: guild.id,
    })

    channel = {
      id: simpleflake(),
      name: "Test Channel",
      parentId: simpleflake(),
      guildId: serverId,
      guild: {
        id: game.snowflake,
        name: "Test Guild",
        channels: {
          fetch: (key) => {
            id: key
          },
        },
      },
      isThread: () => false,
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
    beforeEach(async () => {
      default_game = await DefaultGames.create({
        name: channel.name,
        gameId: game.id,
        snowflake: channel.id.toString(),
        type: DefaultGames.TYPE_CHANNEL,
      })
    })

    it("returns the channel's game", async () => {
      const result = await Service.gameForChannel(channel)

      expect(result.id).toEqual(game.id)
    })

    it("handles missing parentId", async () => {
      channel.parentId = undefined

      const result = await Service.gameForChannel(channel)

      expect(result.id).toEqual(game.id)
    })

    describe("server also has a default game", () => {
      it("returns the channel's game", async () => {
        const game2 = await Games.create({
          name: "Test Game 2",
          guildId: guild.id,
        })
        const server_default = await DefaultGames.create({
          name: guild.name,
          gameId: game.id,
          snowflake: guild.id.toString(),
          type: DefaultGames.TYPE_GUILD,
        })

        const result = await Service.gameForChannel(channel)

        expect(result.id).toEqual(game.id)
      })
    })
  })

  describe("channel has no default game", () => {
    describe("topic has a default game", () => {
      beforeEach(async () => {
        default_game = await DefaultGames.create({
          name: channel.name,
          gameId: game.id,
          snowflake: channel.parentId.toString(),
          type: DefaultGames.TYPE_CHANNEL,
        })
      })

      it("returns the topic's game", async () => {
        const result = await Service.gameForChannel(channel)

        expect(result.id).toEqual(game.id)
      })

      describe("server also has a default game", () => {
        it("returns the topic's game", async () => {
          const game2 = await Games.create({
            name: "Test Game 2",
            guildId: guild.id,
          })
          const server_default = await DefaultGames.create({
            name: guild.name,
            gameId: game.id,
            snowflake: guild.id.toString(),
            type: DefaultGames.TYPE_GUILD,
          })

          const result = await Service.gameForChannel(channel)

          expect(result.id).toEqual(game.id)
        })
      })
    })

    describe("topic has no default game", () => {
      describe("server has a default game", () => {
        it("returns the server's game", async () => {
          default_game = await DefaultGames.create({
            name: guild.name,
            gameId: game.id,
            snowflake: channel.guildId.toString(),
            type: DefaultGames.TYPE_GUILD,
          })

          const result = await Service.gameForChannel(channel)

          expect(result.id).toEqual(game.id)
        })
      })

      describe("server has no default game", () => {
        it("returns null", async () => {
          const result = await Service.gameForChannel(channel)

          expect(result).toBeNull()
        })
      })
    })
  })

  describe("channel is a thread", () => {
    beforeEach(() => {
      channel.isThread = () => true
    })

    it("returns the thread default if one exists", async () => {
      default_game = await DefaultGames.create({
        name: channel.name,
        gameId: game.id,
        snowflake: channel.id.toString(),
        type: DefaultGames.TYPE_CHANNEL,
      })

      const result = await Service.gameForChannel(channel)

      expect(result.id).toEqual(game.id)
    })

    it("returns the other defaults when there is no thread default", async () => {
      default_game = await DefaultGames.create({
        name: channel.name,
        gameId: game.id,
        snowflake: channel.parentId.toString(),
        type: DefaultGames.TYPE_CHANNEL,
      })

      const result = await Service.gameForChannel(channel)

      expect(result.id).toEqual(game.id)
    })
  })
})
