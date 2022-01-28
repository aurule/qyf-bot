const GameManageCompleter = require("./game-manage-completer")
const { Guilds, Games } = require("../models")

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

    const result = await GameManageCompleter.complete(interaction)

    expect(result.length).toEqual(1)
    expect(result[0]).not.toMatchObject({ name: wrong_game.name })
    expect(result[0]).toMatchObject({ name: game.name })

    await wrong_game.destroy()
    await wrong_guild.destroy()
  })

  it("gets games that match the partial text", async () => {
    const result = await GameManageCompleter.complete(interaction)

    expect(result[0]).toMatchObject({ name: game.name, value: `${game.id}` })
  })

  it("gracefully handles no results", async () => {
    interaction.partial_text = "nothing matches"

    const result = await GameManageCompleter.complete(interaction)

    expect(result.length).toEqual(0)
  })
})
