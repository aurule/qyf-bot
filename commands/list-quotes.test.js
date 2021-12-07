const list_quotes_command = require("./list-quotes")

const {
  Guilds,
  Games,
  Quotes,
  Lines,
  DefaultGames,
  Users,
} = require("../models")
const GameChoicesTransformer = require("../transformers/game-choices-transformer")
const QuoteFinder = require("../services/quote-finder")

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
    interaction.command_options.speaker = {}
    interaction.command_options.alias = ""
    interaction.command_options.text = ""
    interaction.command_options.game = null
    interaction.command_options.amount = null
  } catch (err) {
    console.log(err)
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

describe("execute", () => {
  var speaker

  beforeEach(async () => {
    speaker = await Users.create({
      name: "Speaker Man",
      snowflake: simpleflake().toString(),
    })
  })

  afterEach(async () => {
    await speaker.destroy()
  })

  it("gets quotes from finder", async () => {
    const finderSpy = jest.spyOn(QuoteFinder, "findAll")

    await list_quotes_command.execute(interaction)

    expect(finderSpy).toHaveBeenCalled()
  })

  describe("amount", () => {
    it("defaults to five quotes", async () => {
      const finderSpy = jest.spyOn(QuoteFinder, "findAll")
      interaction.command_options.amount = null

      await list_quotes_command.execute(interaction)

      // finderSpy was called with an object including limit:5
      expect(finderSpy.mock.calls[finderSpy.mock.calls.length - 1][0]).toMatchObject({limit: 5})
    })

    it("shows the requested number of quotes", async () => {
      const finderSpy = jest.spyOn(QuoteFinder, "findAll")
      interaction.command_options.amount = 6

      await list_quotes_command.execute(interaction)

      // finderSpy was called with an object including limit:5
      expect(finderSpy.mock.calls[finderSpy.mock.calls.length - 1][0]).toMatchObject({limit: 6})
    })

    it("shows at most ten quotes", async () => {
      const finderSpy = jest.spyOn(QuoteFinder, "findAll")
      interaction.command_options.amount = 20

      await list_quotes_command.execute(interaction)

      // finderSpy was called with an object including limit:5
      expect(finderSpy.mock.calls[finderSpy.mock.calls.length - 1][0]).toMatchObject({limit: 10})
    })
  })

  it("replies with the quote line text", async () => {
    await Quotes.Create({
      saidAt: Date.now(),
      gameId: game.id,
      lines: [
        {
          content: "Quote text is cool",
          speakerId: speaker.id,
          speakerAlias: "Some Dude",
          lineOrder: 0,
        },
      ],
    })

    const reply = await list_quotes_command.execute(interaction)

    expect(reply).toMatch("Some Dude")
  })
})

describe("data", () => {
  beforeEach(async () => {
    await Games.bulkCreate([
      { name: "Test Game 1", guildId: guild.id },
      { name: "Test Game 2", guildId: guild.id },
    ])
    await guild.reload({ include: Games })
  })

  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", async () => {
    const command_data = list_quotes_command.data(guild)

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = list_quotes_command.data(guild)

    expect(command_data.name).toEqual(list_quotes_command.name)
  })
})
