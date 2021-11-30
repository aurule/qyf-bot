"use strict"

const Service = require("./default-game-scope")
const { DefaultGames } = require("../models")

const { simpleflake } = require("simpleflakes")

var channel

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

    xit("stores the server snowflake", async () => {
      const results = Service.explicitScope(channel, true)

      expect(results.target_snowflake).toEqual(guild.id)
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
