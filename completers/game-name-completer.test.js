const GameNameCompleter = require("./game-name-completer")
const { Guilds, Games } = require("../models")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")
const { cache } = require("../util/keyv")

var interaction
var guild
var game

describe("cacheKey", () => {
  it("creates a key including the guild snowflake", () => {
    interaction = new Interaction(simpleflake())

    const result = GameNameCompleter.cacheKey(interaction)

    expect(result).toMatch(interaction.guildId.toString())
  })
})

describe("getCachedGames", () => {

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
      interaction = new Interaction(guild.snowflake)
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
    const key = GameNameCompleter.cacheKey(interaction)
    await cache.set(key, "test data")

    const result = await GameNameCompleter.getCachedGames(interaction)

    expect(result).toEqual("test data")
  })

  it("caches data from the db", async () => {
    const keyvSpy = jest.spyOn(cache, 'set')

    const result = await GameNameCompleter.getCachedGames(interaction)

    expect(keyvSpy).toHaveBeenCalled()
  })
})

describe("completer", () => {
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
      interaction = new Interaction(guild.snowflake)
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

  it("gets games that match the guild", async () => {
    const wrong_guild = await Guilds.create({
      name: "Wrong Guild",
      snowflake: simpleflake().toString(),
    })
    const wrong_game = await Games.create({
      name: "Wrong Game Partial",
      guildId: wrong_guild.id,
    })

    const result = await GameNameCompleter.complete(interaction)

    expect(result.length).toEqual(1)
    expect(result[0]).not.toMatchObject({ name: wrong_game.name })
    expect(result[0]).toMatchObject({ name: game.name })
  })

  it("gets games that match the partial text", async () => {
    const result = await GameNameCompleter.complete(interaction)

    expect(result[0]).toMatchObject({ name: game.name, value: `${game.id}` })
  })

  it("gracefully handles no results", async () => {
    interaction.partial_text = "nothing matches"

    const result = await GameNameCompleter.complete(interaction)

    expect(result.length).toEqual(0)
  })
})
