const rand_quotes_command = require("./rand-quote")

const {
  Guilds,
  Games,
  Quotes,
  Lines,
  DefaultGames,
  Users,
} = require("../models")
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
    interaction.command_options.speaker = undefined
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
    const lines = await Lines.findAll({
      where: { quoteId: quote_ids },
      include: "speaker",
    })
    const line_speaker_ids = lines.map((line) => line.speaker.id)

    await Lines.destroy({ where: { quoteId: quote_ids } })
    await Quotes.destroy({ where: { gameId: game_ids } })
    await Users.destroyByPk(line_speaker_ids)
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

  describe("game selection", () => {
    it("sends the chosen game to the finder", async () => {
      const finderSpy = jest.spyOn(QuoteFinder, "findOne")
      interaction.command_options.game = game.id

      await rand_quotes_command.execute(interaction)

      // finderSpy was called with an object including gameId:game.id
      expect(
        finderSpy.mock.calls[finderSpy.mock.calls.length - 1][0]
      ).toMatchObject({ gameId: [game.id] })
    })
  })

  describe("quote contents", () => {
    it("gets quote content from finder", async () => {
      const finderSpy = jest.spyOn(QuoteFinder, "findOne")

      await rand_quotes_command.execute(interaction)

      expect(finderSpy).toHaveBeenCalled()
    })

    it("replies with the quote line text", async () => {
      await Quotes.create(
        {
          saidAt: Date.now(),
          gameId: game.id,
          Lines: [
            {
              content: "Quote text is cool",
              speakerId: speaker.id,
              speakerAlias: "Some Dude",
              lineOrder: 0,
            },
          ],
        },
        {
          include: Lines,
        }
      )

      const reply = await rand_quotes_command.execute(interaction)

      expect(reply).toMatch("Quote text is cool")
    })
  })

  describe("speaker", () => {
    it("with an existing speaker, queries by speaker's user ID", async () => {
      const finderSpy = jest.spyOn(QuoteFinder, "findOne")
      interaction.command_options.speaker = {id: speaker.snowflake}

      await rand_quotes_command.execute(interaction)

      // finderSpy was called with an object including userId:speaker.id
      expect(
        finderSpy.mock.calls[finderSpy.mock.calls.length - 1][0]
      ).toMatchObject({ userId: [speaker.id] })
    })

    it("with no existing speaker, it replies that there are no quotes", async () => {
      interaction.command_options.speaker = {id: simpleflake().toString()}

      const result = await rand_quotes_command.execute(interaction)

      expect(result).toMatch("No quotes found")
    })
  })
})

describe("getGameOrDefault", () => {
  describe("with a selected game", () => {
    it("returns the chosen game", async () => {
      const result = await rand_quotes_command.getGameOrDefault(
        game.id,
        interaction.channel
      )

      expect(result).toMatchObject({ id: game.id })
    })
  })

  describe("with only a default game", () => {
    beforeEach(async () => {
      await DefaultGames.create({
        gameId: game.id,
        snowflake: guild.snowflake,
        name: guild.name,
        type: DefaultGames.TYPE_GUILD,
      })
    })

    it("returns the default game", async () => {
      const result = await rand_quotes_command.getGameOrDefault(
        null,
        interaction.channel
      )

      expect(result).toMatchObject({ id: game.id })
    })
  })

  describe("without a default or chosen game", () => {
    it("returns a null id", async () => {
      const result = await rand_quotes_command.getGameOrDefault(
        null,
        interaction.channel
      )

      expect(result).toMatchObject({ id: null })
    })

    it("returns 'all games' text for game name", async () => {
      const result = await rand_quotes_command.getGameOrDefault(
        null,
        interaction.channel
      )

      expect(result).toMatchObject({ name: "all games" })
    })
  })

  describe("with the special All Game", () => {
    it("returns a null id", async () => {
      const result = await rand_quotes_command.getGameOrDefault(
        -1,
        interaction.channel
      )

      expect(result).toMatchObject({ name: "all games" })
    })
  })
})

describe("describeResults", () => {
  describe("total quotes", () => {
    it("with a total of one, it describes the single quote", () => {
      const result = rand_quotes_command.describeResults(1, game, "things")

      expect(result).toMatch("a random quote")
    })

    it("with a total of zero, it describes the lack of quotes", () => {
      const result = rand_quotes_command.describeResults(0, game, "things")

      expect(result).toMatch("No quotes found")
    })

    it("with a positive total, it shows the quote contents", () => {
      const result = rand_quotes_command.describeResults(1, game, "things")

      expect(result).toMatch("things")
    })

    it("with a zero total, it does not show the quote contents", () => {
      const result = rand_quotes_command.describeResults(0, game, "things")

      expect(result).not.toMatch("things")
    })
  })

  it("shows the game name", () => {
    const result = rand_quotes_command.describeResults(3, game, "things")

    expect(result).toMatch("from Test Game")
  })

  it("includes the quote contents", () => {
    const result = rand_quotes_command.describeResults(
      3,
      game,
      "things that were said"
    )

    expect(result).toMatch("things that were said")
  })

  it("with an alias, says 'by alias'", () => {
    const result = rand_quotes_command.describeResults(3, game, "things", {
      alias: "alias",
    })

    expect(result).toMatch("by alias")
  })

  it("with an alias and a speaker, says 'by speaker as alias'", () => {
    const speaker = { id: simpleflake().toString() }
    const result = rand_quotes_command.describeResults(0, game, "things", {
      speaker: speaker,
      alias: "alias",
    })

    expect(result).toMatch(`by <@${speaker.id}> as alias`)
  })

  it("with a speaker, says 'by speaker'", () => {
    const speaker = { id: simpleflake().toString() }
    const result = rand_quotes_command.describeResults(0, game, "things", {
      speaker: speaker,
    })

    expect(result).toMatch(`by <@${speaker.id}>`)
  })

  it("with search text, shows the text", () => {
    const result = rand_quotes_command.describeResults(1, game, "things", {
      text: "search text",
    })

    expect(result).toMatch('including "search text"')
  })
})

describe("data", () => {
  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", async () => {
    const command_data = rand_quotes_command.data()

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = rand_quotes_command.data()

    expect(command_data.name).toEqual(rand_quotes_command.name)
  })
})

describe("help", () => {
  it("includes the command name in the output", () => {
    const help_text = rand_quotes_command.help({command_name: "sillyness"})

    expect(help_text).toMatch("sillyness")
  })
})
