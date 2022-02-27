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
const QuotePresenter = require("../presenters/quote-presenter")

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

describe("execute", () => {
  var speaker

  beforeEach(async () => {
    try {
      speaker = await Users.create({
        name: "Speaker Man",
        snowflake: simpleflake().toString(),
      })

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
      interaction.collector = new Collector()

      interaction.reply = (data) => {
        return {
          data: data,
          createMessageComponentCollector: (options) => {
            return interaction.collector
          },
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
      await speaker.destroy()
    } catch (err) {
      console.log(err)
    }
  })

  describe("game selection", () => {
    it("works with a game from the completer", async () => {
      interaction.partial_text = game.name
      const completer = list_quotes_command.autocomplete.get("game")
      const game_arg = await completer
        .complete(interaction)
        .then((values) => values[0].value)
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

      expect(reply.data.embeds[0].description).toMatch("Quote text is cool")
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

  describe("pagination", () => {
    it("next button gets the next page", async () => {
      const buttonInteraction = {
        customId: "paginateNext",
        update: (msg) => msg,
      }
      const updateSpy = jest.spyOn(buttonInteraction, "update")
      await list_quotes_command.execute(interaction)

      await interaction.collector.callbacks.collect(buttonInteraction)

      expect(updateSpy).toHaveBeenCalled()
    })

    it("back button gets the previous page", async () => {
      const buttonInteraction = {
        customId: "paginateBack",
        update: (msg) => msg,
      }
      const updateSpy = jest.spyOn(buttonInteraction, "update")
      await list_quotes_command.execute(interaction)

      await interaction.collector.callbacks.collect(buttonInteraction)

      expect(updateSpy).toHaveBeenCalled()
    })

    it("expiration clears the buttons", async () => {
      const editReplySpy = jest
        .spyOn(interaction, "editReply")
        .mockResolvedValue(true)
      await list_quotes_command.execute(interaction)

      await interaction.collector.callbacks.end()

      expect(editReplySpy).toHaveBeenCalledWith({ components: [] })
    })
  })
})

describe("getGameOrDefault", () => {
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

      interaction.reply = (data) => {
        return {
          data: data,
          createMessageComponentCollector: (options) => {
            return new Collector(options)
          },
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

  describe("with a selected game", () => {
    it("returns the chosen game", async () => {
      const result = await list_quotes_command.getGameOrDefault(
        game.name,
        interaction.channel,
        guild
      )

      expect(result).toMatchObject({ id: game.id })
    })

    it("returns the chosen game by partial match", async () => {
      const result = await list_quotes_command.getGameOrDefault(
        "Test",
        interaction.channel,
        guild
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
        guild
      )

      expect(result).toMatchObject({ id: game.id })
    })
  })

  describe("without a default or chosen game", () => {
    it("returns a null id", async () => {
      const result = await list_quotes_command.getGameOrDefault(
        null,
        interaction.channel,
        guild
      )

      expect(result).toMatchObject({ id: null })
    })

    it("returns 'all games' text for game name", async () => {
      const result = await list_quotes_command.getGameOrDefault(
        null,
        interaction.channel,
        guild
      )

      expect(result).toMatchObject({ name: "all games" })
    })
  })

  describe("with the special All Game", () => {
    it("returns a null id", async () => {
      const result = await list_quotes_command.getGameOrDefault(
        QuoteListGameCompleter.ALL_GAMES,
        interaction.channel,
        guild
      )

      expect(result).toMatchObject({ name: "all games" })
    })
  })
})

describe("describeResults", () => {
  it("with an alias, says 'by alias'", () => {
    const result = list_quotes_command.describeResults(3, {
      alias: "alias",
    })

    expect(result).toMatch("by alias")
  })

  it("with an alias and a speaker, says 'by speaker as alias'", () => {
    const speaker = { id: simpleflake().toString() }
    const result = list_quotes_command.describeResults(3, {
      speaker: speaker,
      alias: "alias",
    })

    expect(result).toMatch(`by <@${speaker.id}> as alias`)
  })

  it("with a speaker, says 'by speaker'", () => {
    const speaker = { id: simpleflake().toString() }
    const result = list_quotes_command.describeResults(3, {
      speaker: speaker,
    })

    expect(result).toMatch(`by <@${speaker.id}>`)
  })

  it("with search text, shows the text", () => {
    const result = list_quotes_command.describeResults(3, {
      text: "search text",
    })

    expect(result).toMatch('including "search text"')
  })

  it("with no quotes, shows no quotes found", () => {
    const result = list_quotes_command.describeResults(0, {})

    expect(result).toMatch("No quotes found")
  })

  it("with quotes but no criteria, says showing all quotes", () => {
    const result = list_quotes_command.describeResults(3, {})

    expect(result).toMatch("Showing all quotes")
  })
})

describe("paginationControls", () => {
  it("returns empty array when there's only one page", () => {
    const result = list_quotes_command.paginationControls(1, 1)

    expect(result).toEqual([])
  })

  it("adds a back button", () => {
    const result = list_quotes_command.paginationControls(1, 9)

    expect(result[0].components[0]).toMatchObject({ customId: "paginateBack" })
  })

  it("disables the back button on the first page", () => {
    const result = list_quotes_command.paginationControls(1, 9)

    expect(result[0].components[0]).toMatchObject({ disabled: true })
  })

  it("enables the back button on later pages", () => {
    const result = list_quotes_command.paginationControls(2, 9)

    expect(result[0].components[0]).toMatchObject({ disabled: false })
  })

  it("adds a next button", () => {
    const result = list_quotes_command.paginationControls(1, 9)

    expect(result[0].components[1]).toMatchObject({ customId: "paginateNext" })
  })

  it("disables the next button on the first page", () => {
    const result = list_quotes_command.paginationControls(2, 9)

    expect(result[0].components[1]).toMatchObject({ disabled: true })
  })

  it("enables the next button on earlier pages", () => {
    const result = list_quotes_command.paginationControls(1, 9)

    expect(result[0].components[1]).toMatchObject({ disabled: false })
  })
})

describe("getPageResults", () => {
  var finderSpy

  beforeEach(() => {
    finderSpy = jest.spyOn(QuoteFinder, "findAndCountAll").mockReturnValue(true)
  })

  it("limits results to one page", () => {
    list_quotes_command.getPageResults(2, {})

    // finderSpy was called with passthrough_options including limit:5
    expect(
      finderSpy.mock.calls[finderSpy.mock.calls.length - 1][1]
    ).toMatchObject({ limit: 5 })
  })

  it("offsets by the current page", () => {
    list_quotes_command.getPageResults(2, {})

    // finderSpy was called with passthrough_options including offset:5
    expect(
      finderSpy.mock.calls[finderSpy.mock.calls.length - 1][1]
    ).toMatchObject({ offset: 5 })
  })
})

describe("QuotePageEmbed", () => {
  describe("title", () => {
    it("includes the game name", () => {
      const embed = new list_quotes_command.QuotePageEmbed({
        quoteResults: { rows: [], count: 0 },
        pageNum: 1,
        game: { name: "Test Game" },
      })

      expect(embed.title).toMatch("Test Game")
    })
  })

  describe("footer", () => {
    it("includes the current page", () => {
      const embed = new list_quotes_command.QuotePageEmbed({
        quoteResults: { rows: [], count: 20 },
        pageNum: 3,
        game: { name: "Test Game" },
      })

      expect(embed.footer.text).toMatch("3 of")
    })

    it("includes the max page", () => {
      const embed = new list_quotes_command.QuotePageEmbed({
        quoteResults: { rows: [], count: 20 },
        pageNum: 3,
        game: { name: "Test Game" },
      })

      expect(embed.footer.text).toMatch("of 4")
    })

    it("is empty with no results", () => {
      const embed = new list_quotes_command.QuotePageEmbed({
        quoteResults: { rows: [], count: 0 },
        pageNum: 1,
        game: { name: "Test Game" },
      })

      expect(embed.footer).toBeNull()
    })
  })

  describe("description", () => {
    it("includes the criteria description", () => {
      const embed = new list_quotes_command.QuotePageEmbed({
        quoteResults: { rows: [], count: 20 },
        pageNum: 3,
        game: { name: "Test Game" },
        alias: "tester",
      })

      expect(embed.description).toMatch("by tester")
    })

    it("includes the quote contents", () => {
      const presenterSpy = jest
        .spyOn(QuotePresenter, "present")
        .mockReturnValue("test quote text")

      const embed = new list_quotes_command.QuotePageEmbed({
        quoteResults: { rows: [], count: 20 },
        pageNum: 3,
        game: { name: "Test Game" },
        alias: "tester",
      })

      expect(embed.description).toMatch("test quote text")
    })
  })

  describe("maxPage", () => {
    it("with an exact multiple, shows the right max page", () => {
      const embed = new list_quotes_command.QuotePageEmbed({
        quoteResults: { rows: [], count: 20 },
        pageNum: 3,
        game: { name: "Test Game" },
      })

      expect(embed.maxPage).toEqual(4)
    })

    it("with an inexact multiple, shows the right max page", () => {
      const embed = new list_quotes_command.QuotePageEmbed({
        quoteResults: { rows: [], count: 19 },
        pageNum: 3,
        game: { name: "Test Game" },
      })

      expect(embed.maxPage).toEqual(4)
    })
  })

  describe("quoteTexts", () => {
    it("presents the quotes", () => {
      const presenterSpy = jest
        .spyOn(QuotePresenter, "present")
        .mockReturnValue("test quote text")
      const embed = new list_quotes_command.QuotePageEmbed({
        quoteResults: { rows: [], count: 19 },
        pageNum: 3,
        game: { name: "Test Game" },
      })

      expect(embed.quoteTexts).toEqual("test quote text")
    })
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
    const help_text = list_quotes_command.help({ command_name: "sillyness" })

    expect(help_text).toMatch("sillyness")
  })
})
