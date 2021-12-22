const append_quote_command = require("./append-quote")

const {
  Guilds,
  Games,
  Quotes,
  Lines,
  Users,
} = require("../models")
const QuoteFinder = require("../services/quote-finder")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")
const { keyv } = require("../util/keyv")

var guild
var interaction
var game
var quote
var line

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
    speaker = await Users.create({
      snowflake: simpleflake().toString(),
      name: "Test Speaker",
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

  const speaker_snowflake = simpleflake()

  interaction.command_options.text = "Text of the quote"
  interaction.command_options.speaker = {
    nickname: "Test Nickname",
    user: {
      id: speaker_snowflake,
      username: "Test Speaker User",
    },
    id: speaker_snowflake,
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

    const result = await append_quote_command.execute(interaction)

    expect(result.content).toMatch("haven't recorded a recent")
  })

  describe("adds a line", () => {
    it("adds a line to the quote", async () => {
      await append_quote_command.execute(interaction)

      expect(await quote.countLines()).toEqual(2)
    })

    it("describes what was done", async () => {
      const replySpy = jest.spyOn(interaction, "reply")

      await append_quote_command.execute(interaction)

      expect(replySpy).toHaveBeenCalledWith(
        "Test User added text from Dude Bro: Text of the quote"
      )
    })

    it("displays the full quote", async () => {
      const result = await append_quote_command.execute(interaction)
      await quote.reload({ include: Lines })

      expect(result).toMatch("The full quote")
      expect(result).toMatch(quote.Lines[0].content)
      expect(result).toMatch(quote.Lines[1].content)
    })

    it("with an error, throws errors up the chain", async () => {
      jest.spyOn(Lines, "create").mockRejectedValue(new Error("test error"))

      expect.assertions(1)

      return append_quote_command
        .execute(interaction)
        .catch((e) => expect(e.message).toMatch("test error"))
    })
  })
})

describe("getSpeakerMember", () => {
  it("uses the provided speaker if given", async () => {
    const speaker_arg = { nickname: "test mann" }

    const result = await append_quote_command.getSpeakerMember(
      speaker_arg,
      interaction,
      null
    )

    expect(result).toEqual(speaker_arg)
  })

  it("falls back on the previous line's speaker", async () => {
    await line.reload({ include: "speaker" })

    const result = await append_quote_command.getSpeakerMember(null, interaction, line)

    expect(result).toEqual(speaker.snowflake)
  })
})

describe("data", () => {
  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", () => {
    const command_data = append_quote_command.data({})

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = append_quote_command.data(guild)

    expect(command_data.name).toEqual(append_quote_command.name)
  })
})
