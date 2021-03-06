const QuoteGameCompleter = require("./quote-game-completer")
const { Guilds, Games, DefaultGames } = require("../models")
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
      const games = await Games.findAll({ where: { guildId: guild.id } })
      const game_ids = games.map((g) => g.id)

      await DefaultGames.destroy({ where: { gameId: game_ids } })
      await Games.destroy({ where: { guildId: guild.id } })
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

    const result = await QuoteGameCompleter.complete(interaction)

    expect(result.length).toEqual(1)
    expect(result[0]).not.toMatchObject({ name: wrong_game.name })
    expect(result[0]).toMatchObject({ name: game.name })

    await wrong_game.destroy()
    await wrong_guild.destroy()
  })

  it("gets games that match the partial text", async () => {
    const result = await QuoteGameCompleter.complete(interaction)

    expect(result[0]).toMatchObject({ name: game.name, value: game.name })
  })

  it("matches regardless of case", async () => {
    interaction.partial_text = "test game"

    const result = await QuoteGameCompleter.complete(interaction)

    expect(result[0].value).toMatch(game.name)
  })

  it("gracefully handles no results", async () => {
    interaction.partial_text = "nothing matches"

    const result = await QuoteGameCompleter.complete(interaction)

    expect(result.length).toEqual(0)
  })

  it("uses the game name as its value", async () => {
    const result = await QuoteGameCompleter.complete(interaction)

    expect(result[0].value).toEqual(result[0].name)
  })

  describe("with a default game", () => {
    it("shows which game is the current default", async () => {
      const game2 = await Games.create({
        guildId: guild.id,
        name: "Second test game",
      })

      const defgame2 = await DefaultGames.create({
        name: guild.name,
        snowflake: guild.snowflake,
        type: DefaultGames.TYPE_GUILD,
        gameId: game2.id,
      })

      interaction.partial_text = "second"

      const result = await QuoteGameCompleter.complete(interaction)

      expect(result[0]).toMatchObject({ name: `${game2.name} (default)`, value: game2.name })

      await defgame2.destroy()
      await game2.destroy()
    })
  })

  it("gets at most 25 games", async () => {
    jest.spyOn(GamesForGuild, 'get').mockResolvedValue(
      Array.from(Array(30).keys(), (x, i) => { return { name: `partial game ${i}` } })
    )

    const result = await QuoteGameCompleter.complete(interaction)

    expect(result.length).toEqual(25)
  })
})
