const menu_append_quote_command = require("./menu-append-quote")

const { Guilds, Games, Quotes, Lines, Users } = require("../models")
const QuoteFinder = require("../services/quote-finder")

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
      name: "Menu Append Test Guild",
      snowflake: simpleflake().toString(),
    })
    game = await Games.create({
      name: "Menu Append Test Game",
      guildId: guild.id,
    })
    speaker = await Users.create({
      snowflake: simpleflake().toString(),
      name: "Menu Append Test Speaker",
    })
    quote = await Quotes.create({
      gameId: game.id,
    })
    line = await Lines.create({
      quoteId: quote.id,
      content: "test line one",
      speakerId: speaker.id,
      lineOrder: 0,
    })
    quote = await quote.reload({ include: Lines })
    interaction = new Interaction(guild.snowflake)
  } catch (err) {
    console.log(err)
  }

  interaction.targetId = 1
  speaker_user = {
    id: speaker.snowflake,
    username: "Test Mann",
    nickname: "Testyboi",
  }
  interaction.channel.messages.fetch = (id) => {
    return { content: "Text of the quote", author: speaker_user }
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
    await Games.destroy({ where: { guildId: guild.id } })
    await guild.destroy()
  } catch (err) {
    console.log(err)
  }
})

describe("execute", () => {
  var finderSpy

  beforeEach(() => {
    finderSpy = jest.spyOn(QuoteFinder, "findLastEditable").mockResolvedValue(quote)
  })

  it("with no quote, it replies with instructions", async () => {
    finderSpy.mockReturnValue(null)

    const result = await menu_append_quote_command.execute(interaction)

    expect(result.content).toMatch("haven't recorded a recent")
  })

  describe("adds a line", () => {
    it("adds a line to the quote", async () => {
      await menu_append_quote_command.execute(interaction)

      expect(await quote.countLines()).toEqual(2)
    })

    it("describes what was done", async () => {
      const replySpy = jest.spyOn(interaction, "reply")

      await menu_append_quote_command.execute(interaction)

      expect(replySpy).toHaveBeenCalled()
    })

    it("displays the full quote", async () => {
      const result = await menu_append_quote_command.execute(interaction)
      await quote.reload({ include: Lines })

      expect(result).toMatch("The full quote")
      expect(result).toMatch(quote.Lines[0].content)
      expect(result).toMatch(quote.Lines[1].content)
    })

    it("with an error, throws errors up the chain", async () => {
      jest.spyOn(Lines, "create").mockRejectedValue(new Error("test error"))

      expect.assertions(1)

      return menu_append_quote_command
        .execute(interaction)
        .catch((e) => expect(e.message).toMatch("test error"))
    })
  })
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

describe("help", () => {
  it("includes the command name in the output", () => {
    const help_text = menu_append_quote_command.help({command_name: "sillyness"})

    expect(help_text).toMatch("sillyness")
  })
})

