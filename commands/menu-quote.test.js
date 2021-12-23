"use strict"

const Command = require("./menu-quote")
const { Guilds, Games, DefaultGames, Quotes, Lines } = require("../models")
const DefaultGameScopeService = require("../services/default-game-scope")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")
const { followup_store } = require("../util/keyv")

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

describe("execute", () => {
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
      await Command.execute(interaction)
      const quote = await Quotes.findOne({
        where: { gameId: game.id },
        include: Lines,
      })

      expect(quote.Lines[0].content).toEqual(message_text)
    })

    describe("reply", () => {
      beforeEach(() => {
        jest
          .spyOn(DefaultGameScopeService, "gameForChannel")
          .mockReturnValue(game)
      })

      it("says who saved the quote", async () => {
        const reply = await Command.execute(interaction)

        expect(reply).toMatch(interaction.user.username)
      })

      it("displays the quote text", async () => {
        const reply = await Command.execute(interaction)

        expect(reply).toMatch(message_text)
      })

      it("throws errors up the chain", async () => {
        jest.spyOn(Quotes, "create").mockRejectedValue(new Error("test error"))

        expect.assertions(1)

        return Command
          .execute(interaction)
          .catch((e) => expect(e.message).toMatch("test error"))
      })
    })
  })

  describe("with no default game", () => {
    it("stores the quote info for later followup", async () => {
      const keyvSpy = jest.spyOn(followup_store, "set")

      const reply = await Command.execute(interaction)

      expect(keyvSpy).toHaveBeenCalled()
    })

    it("replies with a game prompt", async () => {
      const reply = await Command.execute(interaction)

      expect(reply.content).toMatch("Which game")
    })
  })
})

describe("data", () => {
  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", () => {
    const command_data = Command.data({})

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = Command.data(guild)

    expect(command_data.name).toEqual(Command.name)
  })
})

describe("help", () => {
  it("includes the command name in the output", () => {
    const help_text = Command.help({command_name: "sillyness"})

    expect(help_text).toMatch("sillyness")
  })
})
