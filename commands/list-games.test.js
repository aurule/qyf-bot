const list_games_command = require("./list-games")
const { Guilds, Games, DefaultGames } = require("../models")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")

var interaction
var guild

beforeEach(async () => {
  try {
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: simpleflake().toString(),
    })
    interaction = new Interaction(guild.snowflake)
  } catch (err) {
    console.log(err)
  }
})

afterEach(async () => {
  try {
    await Games.destroy({ where: { guildId: guild.id } })
    await guild.destroy()
  } catch (err) {
    console.log(err)
  }
})

describe("execute", () => {
  it("includes all games for the current guild", async () => {
    const game1 = await Games.create({
      name: "test game 1",
      guildId: guild.id,
    })
    const game2 = await Games.create({
      name: "test game 2",
      guildId: guild.id,
    })

    const results = await list_games_command.execute(interaction)

    expect(results).toMatch(game1.name)
    expect(results).toMatch(game2.name)
  })

  it("excludes games from other guilds", async () => {
    const wrong_guild = await Guilds.create({
      name: "wrong guild",
      snowflake: simpleflake().toString(),
    })
    const wrong_game = await Games.create({
      name: "wrong game",
      guildId: wrong_guild.id,
    })
    const right_game = await Games.create({
      name: "right game",
      guildId: guild.id,
    })

    const results = await list_games_command.execute(interaction)

    expect(results).toMatch(right_game.name)
    expect(results).not.toMatch(wrong_game.name)

    // special teardown required
    await wrong_game.destroy()
    await wrong_guild.destroy()
  })
})
