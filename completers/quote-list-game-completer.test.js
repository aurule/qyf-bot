const QuoteListGameCompleter = require("./quote-list-game-completer")
const { Guilds, Games } = require("../models")
const GamesForGuild = require("../caches/games-for-guild")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")
const { cache } = require("../util/keyv")

var interaction
var guild
var game

describe("complete", () => {
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

    const result = await QuoteListGameCompleter.complete(interaction)

    expect(result.length).toEqual(2)
    expect(result[0]).not.toMatchObject({ name: wrong_game.name })
    expect(result[0]).toMatchObject({ name: game.name })

    await wrong_game.destroy()
    await wrong_guild.destroy()
  })

  it("gets games that match the partial text", async () => {
    const result = await QuoteListGameCompleter.complete(interaction)

    expect(result[0]).toMatchObject({ name: game.name, value: game.name })
  })

  it("matches regardless of case", async () => {
    interaction.partial_text = "test game"

    const result = await QuoteListGameCompleter.complete(interaction)

    expect(result[0].value).toMatch(game.name)
  })

  it("gracefully handles no results", async () => {
    interaction.partial_text = "nothing matches"

    const result = await QuoteListGameCompleter.complete(interaction)

    expect(result.length).toEqual(1)
  })

  it("includes a valid All Games entry", async () => {
    interaction.partial_text = "nothing matches"

    const result = await QuoteListGameCompleter.complete(interaction)

    expect(result[0]).toEqual({name: "All Games", value: "All Games"})
  })

  it("uses the game name as its value", async () => {
    const result = await QuoteListGameCompleter.complete(interaction)

    expect(result[0].value).toEqual(result[0].name)
  })

  it("gets at most 25 games", async () => {
    jest.spyOn(GamesForGuild, 'get').mockResolvedValue(
      Array.from(Array(30).keys(), (x, i) => { return { name: `partial game ${i}` } })
    )

    const result = await QuoteListGameCompleter.complete(interaction)

    expect(result.length).toEqual(25)
  })
})
