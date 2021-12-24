const GamesForGuild = require("./games-for-guild")
const { Guilds, Games } = require("../models")

const { simpleflake } = require("simpleflakes")
const { cache } = require("../util/keyv")

var guild
var game

describe("key", () => {
  it("creates a key including the guild snowflake", () => {
    snowflake = simpleflake().toString()

    const result = GamesForGuild.key(snowflake)

    expect(result).toMatch(snowflake)
  })
})

describe("get", () => {

  beforeEach(async () => {
    try {
      guild = await Guilds.create({
        name: "Test Guild",
        snowflake: simpleflake().toString(),
      })

      game = await Games.create({
        guildId: guild.id,
        name: "Test Game Partialities"
      })
    } catch (err) {
      console.log(err)
    }
  })

  afterEach(async () => {
    try {
      await game.destroy()
      await guild.destroy()
    } catch (err) {
      console.log(err)
    }
  })

  it("returns any cached data", async () => {
    const snowflake = simpleflake().toString()
    const key = GamesForGuild.key(snowflake)
    await cache.set(key, "test data")

    const result = await GamesForGuild.get(snowflake)

    expect(result).toEqual("test data")
  })

  it("caches data from the db", async () => {
    const snowflake = simpleflake().toString()
    const keyvSpy = jest.spyOn(cache, 'set')

    const result = await GamesForGuild.get(snowflake)

    expect(keyvSpy).toHaveBeenCalled()
  })
})
