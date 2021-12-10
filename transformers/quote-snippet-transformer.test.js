const { transform } = require("./quote-snippet-transformer")

const { Guilds, Games, Quotes, Lines } = require("../models")

const { simpleflake } = require("simpleflakes")

var guild
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
    await Games.destroy({ where: { guildId: guild.id } })
    await guild.destroy()
  } catch (err) {
    console.log(err)
  }
})

it("shows the text of each line in a quote", async () => {
  await Quotes.create(
    {
      saidAt: Date.now,
      gameId: game.id,
      Lines: [
        {
          content: "First line",
          lineOrder: 0,
        },
        {
          content: "Second line",
          lineOrder: 1,
        },
      ],
    },
    {
      include: Lines,
    }
  )

  const quotes = await Quotes.findAll({
    where: { gameId: game.id },
    include: Lines,
  })

  const result = transform(quotes)

  expect(result).toMatch("First line")
  expect(result).toMatch("Second line")
})

it("works on a single quote", async () => {
  await Quotes.create(
    {
      saidAt: Date.now,
      gameId: game.id,
      Lines: [
        {
          content: "First line",
          lineOrder: 0,
        },
        {
          content: "Second line",
          lineOrder: 1,
        },
      ],
    },
    {
      include: Lines,
    }
  )

  const quote = await Quotes.findOne({
    where: { gameId: game.id },
    include: Lines,
  })

  const result = transform(quote)

  expect(result).toMatch("First line")
  expect(result).toMatch("Second line")
})

it("shows the attribution of each line in a quote", async () => {
  await Quotes.create(
    {
      saidAt: Date.now,
      gameId: game.id,
      Lines: [
        {
          content: "First line",
          lineOrder: 0,
          speakerAlias: "Person 1"
        },
        {
          content: "Second line",
          lineOrder: 1,
          speakerAlias: "Person 2"
        },
      ],
    },
    {
      include: Lines,
    }
  )

  const quotes = await Quotes.findAll({
    where: { gameId: game.id },
    include: Lines,
  })

  const result = transform(quotes)

  expect(result).toMatch("Person 1")
  expect(result).toMatch("Person 2")
})

it("shows the text of all quotes", async () => {
  await Quotes.create(
    {
      saidAt: Date.now,
      gameId: game.id,
      Lines: [
        {
          content: "First line",
          lineOrder: 0,
        },
        {
          content: "Second line",
          lineOrder: 1,
        },
      ],
    },
    {
      include: Lines,
    }
  )
  await Quotes.create(
    {
      saidAt: Date.now,
      gameId: game.id,
      Lines: [
        {
          content: "First line quote 2",
          lineOrder: 0,
        },
        {
          content: "Second line quote 2",
          lineOrder: 1,
        },
      ],
    },
    {
      include: Lines,
    }
  )

  const quotes = await Quotes.findAll({
    where: { gameId: game.id },
    include: Lines,
  })

  const result = transform(quotes)

  expect(result).toMatch("quote 2")
})
