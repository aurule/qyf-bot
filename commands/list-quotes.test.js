const list_quotes_command = require("./list-quotes")

const {
  Guilds,
  Games,
  Quotes,
  Lines,
  DefaultGames,
  Users,
} = require("../models")
const QuoteFinder = require("../services/quote-finder")
const QuoteListGameCompleter = require("../completers/quote-list-game-completer")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")

var guild
var interaction
var game

class Collector {
  constructor(options) {
    this.callbacks = {}
  }

  on(eventName, callback) {
    this.callbacks[eventName] = callback
  }
}

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

    interaction.reply = data => {
      return {
        data: data,
        createMessageComponentCollector: (options) => {
          return new Collector(options)
        }
      }
    }
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
    it("works with a game from the completer", async () => {
      interaction.partial_text = game.name
      const completer = list_quotes_command.autocomplete.get("game")
      const game_arg = await completer.complete(interaction).then((values) => values[0].value)
      interaction.command_options.game = game_arg
      const finderSpy = jest.spyOn(QuoteFinder, "findAndCountAll")

      await list_quotes_command.execute(interaction)

      // finderSpy was called with an object including gameId:game.id
      expect(
        finderSpy.mock.calls[finderSpy.mock.calls.length - 1][0]
      ).toMatchObject({ gameId: [game.id] })
    })

    it("sends the chosen game to the finder", async () => {
      const finderSpy = jest.spyOn(QuoteFinder, "findAndCountAll")
      interaction.command_options.game = game.name

      await list_quotes_command.execute(interaction)

      // finderSpy was called with an object including gameId:game.id
      expect(
        finderSpy.mock.calls[finderSpy.mock.calls.length - 1][0]
      ).toMatchObject({ gameId: [game.id] })
    })
  })

  describe("quote contents", () => {
    it("gets quotes from finder", async () => {
      const finderSpy = jest.spyOn(QuoteFinder, "findAndCountAll")

      await list_quotes_command.execute(interaction)

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

      const reply = await list_quotes_command.execute(interaction)

      expect(reply.data.content).toMatch("Quote text is cool")
    })
  })

  describe("speaker", () => {
    it("with an existing speaker, queries by speaker's user ID", async () => {
      const finderSpy = jest.spyOn(QuoteFinder, "findAndCountAll")
      interaction.command_options.speaker = { id: speaker.snowflake }

      await list_quotes_command.execute(interaction)

      // finderSpy was called with an object including userId:speaker.id
      expect(
        finderSpy.mock.calls[finderSpy.mock.calls.length - 1][0]
      ).toMatchObject({ userId: [speaker.id] })
    })

    it("with no existing speaker, it replies that there are no quotes", async () => {
      interaction.command_options.speaker = { id: simpleflake().toString() }

      const result = await list_quotes_command.execute(interaction)

      expect(result.data).toMatch("No quotes found")
    })
  })
})

describe("getGameOrDefault", () => {
  describe("with a selected game", () => {
    it("returns the chosen game", async () => {
      const result = await list_quotes_command.getGameOrDefault(
        game.name,
        interaction.channel,
        guild.id,
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
      const result = await list_quotes_command.getGameOrDefault(
        null,
        interaction.channel,
        guild.id,
      )

      expect(result).toMatchObject({ id: game.id })
    })
  })

  describe("without a default or chosen game", () => {
    it("returns a null id", async () => {
      const result = await list_quotes_command.getGameOrDefault(
        null,
        interaction.channel,
        guild.id,
      )

      expect(result).toMatchObject({ id: null })
    })

    it("returns 'all games' text for game name", async () => {
      const result = await list_quotes_command.getGameOrDefault(
        null,
        interaction.channel,
        guild.id,
      )

      expect(result).toMatchObject({ name: "all games" })
    })
  })

  describe("with the special All Game", () => {
    it("returns a null id", async () => {
      const result = await list_quotes_command.getGameOrDefault(
        QuoteListGameCompleter.ALL_GAMES,
        interaction.channel,
        guild.id,
      )

      expect(result).toMatchObject({ name: "all games" })
    })
  })
})

describe("describeResults", () => {
  it("shows the current page number", () => {
    const result = list_quotes_command.describeResults(1, 3, game, "things")

    expect(result).toMatch("page 1 of")
  })

  it("shows the max page number", () => {
    const result = list_quotes_command.describeResults(1, 9, game, "things")

    expect(result).toMatch("page 1 of 2")
  })

  it("shows the game name", () => {
    const result = list_quotes_command.describeResults(3, 3, game, "things")

    expect(result).toMatch("from Test Game")
  })

  it("includes the quote contents", () => {
    const result = list_quotes_command.describeResults(
      3,
      3,
      game,
      "things that were said"
    )

    expect(result).toMatch("things that were said")
  })

  it("with an alias, says 'by alias'", () => {
    const result = list_quotes_command.describeResults(3, 3, game, "things", {
      alias: "alias",
    })

    expect(result).toMatch("by alias")
  })

  it("with an alias and a speaker, says 'by speaker as alias'", () => {
    const speaker = { id: simpleflake().toString() }
    const result = list_quotes_command.describeResults(0, 0, game, "things", {
      speaker: speaker,
      alias: "alias",
    })

    expect(result).toMatch(`by <@${speaker.id}> as alias`)
  })

  it("with a speaker, says 'by speaker'", () => {
    const speaker = { id: simpleflake().toString() }
    const result = list_quotes_command.describeResults(0, 0, game, "things", {
      speaker: speaker,
    })

    expect(result).toMatch(`by <@${speaker.id}>`)
  })

  it("with search text, shows the text", () => {
    const result = list_quotes_command.describeResults(1, 1, game, "things", {
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
    const command_data = list_quotes_command.data()

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = list_quotes_command.data()

    expect(command_data.name).toEqual(list_quotes_command.name)
  })
})

describe("help", () => {
  it("includes the command name in the output", () => {
    const help_text = list_quotes_command.help({command_name: "sillyness"})

    expect(help_text).toMatch("sillyness")
  })
})
