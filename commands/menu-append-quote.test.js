const menu_append_quote_command = require("./menu-append-quote")

const { Guilds, Games, DefaultGames, Quotes, Lines } = require("../models")
const DefaultGameScopeService = require("../services/default-game-scope")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")
const { keyv } = require("../util/keyv")

var guild
var interaction
var game
let speaker = {
  id: simpleflake(),
  username: "Test Mann",
  nickname: "Testyboi",
}
let message_text = "Text of the quote"

beforeEach(async () => {
  try {
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: simpleflake().toString(),
    })
    game = await Games.create({
      name: "Test Game",
      guildId: guild.id,
    })
    interaction = new Interaction(guild.snowflake)
  } catch (err) {
    console.log(err)
  }

  interaction.targetId = 1
  interaction.channel.messages.fetch = (id) => {
    return { content: "Text of the quote", author: speaker }
  }
})

afterEach(async () => {
  try {
    const games = await Games.findAll({ where: { guildId: guild.id } })
    const game_ids = games.map((g) => g.id)
    const quotes = await Quotes.findAll({ where: { gameId: game_ids } })
    const quote_ids = quotes.map((q) => q.id)

    await Lines.destroy({ where: { quoteId: quote_ids } })
    await Quotes.destroy({ where: { gameId: game_ids } })
    await DefaultGames.destroy({ where: { gameId: game_ids } })
    await Games.destroy({ where: { guildId: guild.id } })
    await guild.destroy()
  } catch (err) {
    console.log(err)
  }
})

describe("data", () => {
  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", () => {
    const command_data = menu_append_quote_command.data({})

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = menu_append_quote_command.data(guild)

    expect(command_data.name).toEqual(menu_append_quote_command.name)
  })
})
