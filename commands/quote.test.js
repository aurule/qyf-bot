"use strict"

const quote_command = require("./quote")
const {
  Guilds,
  Games,
  DefaultGames,
  Quotes,
  Lines,
} = require("../models")
const DefaultGameScopeService = require("../services/default-game-scope")
const QuoteBuilder = require("../services/quote-builder")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")
const { followup_store } = require("../util/keyv")

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
    await DefaultGames.destroy({ where: { gameId: game_ids } })
    await Games.destroy({ where: { guildId: guild.id } })
    await guild.destroy()
  } catch (err) {
    console.log(err)
  }
})

describe("execute", () => {
  beforeEach(() => {
    interaction.command_options.game = game.name
  })

  it("gets the correct game", async () => {
    const getterSpy = jest.spyOn(quote_command, "getGame")

    await quote_command.execute(interaction)

    expect(getterSpy).toHaveBeenCalled()
  })

  it("aborts without a game", async () => {
    jest.spyOn(quote_command, "getGame").mockResolvedValue(null)
    const makerSpy = jest.spyOn(QuoteBuilder, "makeQuote")

    await quote_command.execute(interaction)

    expect(makerSpy).not.toHaveBeenCalled()
  })

  describe("reply", () => {
    it("says who saved the quote", async () => {
      const reply = await quote_command.execute(interaction)

      expect(reply).toMatch(interaction.user.id.toString())
    })

    it("displays the quote text", async () => {
      const reply = await quote_command.execute(interaction)

      expect(reply).toMatch(interaction.command_options.text)
    })

    it("displays the quote speaker", async () => {
      const reply = await quote_command.execute(interaction)

      expect(reply).toMatch(interaction.command_options.alias)
    })

    it("throws errors up the chain", async () => {
      jest.spyOn(Quotes, 'create').mockRejectedValue(new Error("test error"))

      expect.assertions(1)

      return quote_command
        .execute(interaction)
        .catch((e) => expect(e.message).toMatch("test error"))
    })
  })
})

describe("getGame", () => {
  describe("with a default game", () => {
    beforeEach(async () => {
      await DefaultGames.create({
        name: guild.name,
        snowflake: guild.snowflake,
        type: DefaultGames.TYPE_GUILD,
        gameId: game.id,
      })
    })

    it("returns the default game", async () => {
      const result = await quote_command.getGame(null, guild, interaction)

      expect(result.id).toEqual(game.id)
    })

    describe("with a game arg", () => {
      it("works with a game from the completer", async () => {
        interaction.partial_text = game.name
        const completer = quote_command.autocomplete.get("game")
        const game_arg = await completer.complete(interaction).then((values) => values[0].value)

        const result = await quote_command.getGame(game_arg, guild, interaction)

        expect(result.id).toEqual(game.id)
      })

      it("returns the chosen game", async () => {
        const game2 = await Games.create({
          name: "Test Game 2",
          guildId: guild.id,
        })
        const result = await quote_command.getGame(game2.name, guild, interaction)

        expect(result.id).toEqual(game2.id)
      })

      it("returns the chosen game from a partial name", async () => {
        const game2 = await Games.create({
          name: "Some Other Game",
          guildId: guild.id,
        })
        const result = await quote_command.getGame("Other", guild, interaction)

        expect(result.id).toEqual(game2.id)
      })
    })
  })

  describe("with no default game", () => {
    describe("without game arg", () => {
      beforeEach(() => {
        interaction.reply = async (data) => {
          interaction.replied = true
          return {
            data: data,
            awaitMessageComponent: (options) => { return Promise.resolve({ values: [game.id] }) }
          }
        }
      })

      it("gets the game from a prompt", async () => {
        const promptSpy = jest.spyOn(quote_command, "promptForGame")
        await guild.reload({include: Games})

        const result = await quote_command.getGame(null, guild, interaction)

        expect(promptSpy).toHaveBeenCalled()
      })
    })

    describe("with a game arg", () => {
      it("works with a game from the completer", async () => {
        interaction.partial_text = game.name
        const completer = quote_command.autocomplete.get("game")
        const game_arg = await completer.complete(interaction).then((values) => values[0].value)

        const result = await quote_command.getGame(game_arg, guild, interaction)

        expect(result.id).toEqual(game.id)
      })

      it("returns the chosen game", async () => {
        const result = await quote_command.getGame(game.name, guild, interaction)

        expect(result.id).toEqual(game.id)
      })
    })
  })
})

describe("promptForGame", () => {
  let selection

  beforeEach(async () => {
    await guild.reload({ include: Games })

    selection = (result, options) => Promise.resolve({ values: [result] })

    interaction.reply = async (data) => {
      interaction.replied = true
      return {
        data: data,
        awaitMessageComponent: async (options) => { return selection(game.id, options) }
      }
    }
  })

  it("replies with a select menu", async () => {
    const replySpy = jest.spyOn(interaction, "reply")

    await quote_command.promptForGame(interaction, guild)

    // replySpy was called with the correct select component
    const selectBuilder = replySpy.mock.calls[replySpy.mock.calls.length - 1][0].components[0].components[0]
    expect(
      selectBuilder.data.custom_id
    ).toEqual("newQuoteGameSelect")
  })

  it("returns the selected game", async () => {
    const result = await quote_command.promptForGame(interaction, guild)

    expect(result.id).toEqual(game.id)
  })

  it("warns if there is no response", async () => {
    selection = result => Promise.reject({ code: "INTERACTION_COLLECTOR_ERROR" })
    const editReplySpy = jest.spyOn(interaction, "editReply")

    const result = await quote_command.promptForGame(interaction, guild)

    expect(editReplySpy).toHaveBeenCalled()
    expect(result).toBeNull()
  })

  it("throws on an unknown error", async () => {
    selection = result => Promise.reject({ code: "OH NO", message: "test error" })
    const editReplySpy = jest.spyOn(interaction, "editReply")

    expect.assertions(1)

    return quote_command
      .promptForGame(interaction, guild)
      .catch((e) => expect(e.message).toMatch("test error"))
  })

  describe("filter", () => {
    let selectInteraction

    beforeEach(() => {
      selectInteraction = new Interaction(guild.snowflake)
      selection = jest.fn((result, options) => {
        const filterStatus = options.filter(selectInteraction)
        return {
          values: [game.id],
          filterStatus,
        }
      })
    })

    it("calls deferUpdate immediately", async () => {
      const deferSpy = jest.spyOn(selectInteraction, "deferUpdate")

      await quote_command.promptForGame(interaction, guild)

      expect(deferSpy).toHaveBeenCalled()
    })

    it("returns true when the user matches the original user", async () => {
      selectInteraction.user = interaction.user

      await quote_command.promptForGame(interaction, guild)

      expect(selection).toHaveReturnedWith({
        values: [game.id],
        filterStatus: true,
      })
    })

    it("returns false when the user does not match the original user", async () => {
      await quote_command.promptForGame(interaction, guild)

      expect(selection).toHaveReturnedWith({
        values: [game.id],
        filterStatus: false,
      })
    })
  })
})

describe("data", () => {
  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", () => {
    const command_data = quote_command.data({})

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = quote_command.data(guild)

    expect(command_data.name).toEqual(quote_command.name)
  })
})

describe("help", () => {
  it("includes the command name in the output", () => {
    const help_text = quote_command.help({command_name: "sillyness"})

    expect(help_text).toMatch("sillyness")
  })
})
