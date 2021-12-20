const Followup = require("./new-quote-game-select")

const {
  Guilds,
  Games,
  Quotes,
  Lines,
} = require("../models")
const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")
const { keyv } = require("../util/keyv.js")
const { QuoteData } = require("../services/quote-builder")

var guild
var interaction
var game
const quote_options = new QuoteData({
  text: "Test quote text",
  attribution: "The Person",
  speaker: {
    id: 1,
    username: "TheFiddler"
  }
})
const caller_id = simpleflake()

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

  interaction.values = [game.id.toString()]
  interaction.message.interaction = {id: caller_id}
  keyv.set(caller_id, quote_options)
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

it("saves the quote to the chosen game", async () => {
  await Followup.execute(interaction)
  const quote = await Quotes.findOne({
    where: { gameId: game.id },
    include: Lines,
  })

  expect(quote.Lines[0].content).toEqual(quote_options.text)
})

describe("reply", () => {
  it("says who saved the quote", async () => {
    const reply = await Followup.execute(interaction)

    expect(reply).toMatch(interaction.user.username)
  })

  it("displays the quote text", async () => {
    const reply = await Followup.execute(interaction)

    expect(reply).toMatch(quote_options.text)
  })

  it("displays the quote speaker", async () => {
    const reply = await Followup.execute(interaction)

    expect(reply).toMatch(quote_options.attribution)
  })

  it("notifies if there is an error", async () => {
    jest.spyOn(Quotes, 'create').mockRejectedValue(new Error("test error"))

    const reply = await Followup.execute(interaction)

    expect(reply).toMatch("Something went wrong")
  })
})
