"use strict"

const quote_command = require("./quote")
const {
  Guilds,
  Games,
  DefaultGames,
  Quotes,
  Lines,
  Speakers,
} = require("../models")
const DefaultGameScopeService = require("../services/default-game-scope")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")

var guild
var interaction
var game

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

  interaction.command_options.text = "Text of the quote"
  interaction.command_options.speaker = {
    username: "Test Speaker User",
    id: simpleflake(),
  }
  interaction.command_options.alias = "Dude Bro"
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

describe("with a default game", () => {
  beforeEach(async () => {
    await DefaultGames.create({
      name: guild.name,
      snowflake: guild.snowflake,
      type: DefaultGames.TYPE_GUILD,
      gameId: game.id,
    })
  })

  it("saves the quote for the default game", async () => {
    await quote_command.execute(interaction)
    const quote = await Quotes.findOne({
      where: { gameId: game.id },
      include: Lines,
    })

    expect(quote.Lines[0].content).toEqual(interaction.command_options.text)
  })

  describe("reply", () => {
    beforeEach(() => {
      jest
        .spyOn(DefaultGameScopeService, "gameForChannel")
        .mockImplementation((chan) => game)
    })

    it("says who saved the quote", async () => {
      const reply = await quote_command.execute(interaction)

      expect(reply).toMatch(interaction.user.name)
    })

    it("displays the quote text", async () => {
      const reply = await quote_command.execute(interaction)

      expect(reply).toMatch(interaction.command_options.text)
    })

    it("displays the quote speaker", async () => {
      const reply = await quote_command.execute(interaction)

      expect(reply).toMatch(interaction.command_options.alias)
    })
  })
})

describe("with no default game", () => {
  it.todo("stores the quote info for later followup")

  it.todo("replies with a game prompt")
})
