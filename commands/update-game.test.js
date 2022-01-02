const update_game_command = require("./update-game")
const { Guilds, Games } = require("../models")
const CommandPolicy = require("../services/command-policy")
const GamesForGuild = require("../caches/games-for-guild")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")
const { UniqueConstraintError } = require("sequelize")

var guild
var game
var interaction
var cacheDeleteSpy

beforeEach(async () => {
  try {
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: simpleflake().toString(),
    })
    game = await Games.create({
      name: "Test Game",
      description: "Test description",
      guildId: guild.id,
    })
  } catch (err) {
    console.log(err)
  }

  interaction = new Interaction(guild.snowflake)
  interaction.command_options.game = game.id
  interaction.command_options.name = ""
  interaction.command_options.description = ""

  cacheDeleteSpy = jest
    .spyOn(GamesForGuild, "delete")
    .mockResolvedValue(true)
})

afterEach(async () => {
  try {
    await Games.destroy({ where: { guildId: guild.id } })
    await guild.destroy()
  } catch (err) {
    console.log(err)
  }
})

describe("execute", () => {
  describe("with a new name and no description", () => {
    beforeEach(() => {
      interaction.command_options.name = "New Name"
      interaction.command_options.description = ""
    })

    it("updates the game with the new name", async () => {
      await update_game_command.execute(interaction)
      await game.reload()

      expect(game.name).toEqual("New Name")
    })

    it("does not change the description", async () => {
      await update_game_command.execute(interaction)
      await game.reload()

      expect(game.description).toEqual("Test description")
    })

    it("clears the guild games cache", async () => {
      await update_game_command.execute(interaction)

      expect(cacheDeleteSpy).toHaveBeenCalled()
    })

    it("replies with the updated game info", async () => {
      const reply = await update_game_command.execute(interaction)
      await game.reload()

      expect(reply).toMatch(game.name)
    })

    describe("with a duplicate name", () => {
      it("replies that the game already exists", async () => {
        jest.spyOn(game, "update").mockRejectedValue(new UniqueConstraintError())
        jest.spyOn(Games, "findOne").mockResolvedValue(game)

        const reply = await update_game_command.execute(interaction)

        expect(reply).toMatch('The game "New Name" already exists!')
      })
    })

    it("throws game errors up the chain", async () => {
      jest.spyOn(Games, "findOne").mockRejectedValue(new Error("test error"))

      expect.assertions(1)

      return update_game_command
        .execute(interaction)
        .catch((e) => expect(e.message).toMatch("test error"))
    })

    it("throws guild errors up the chain", async () => {
      jest
        .spyOn(Guilds, "findByInteraction")
        .mockRejectedValue(new Error("test error"))

      expect.assertions(1)

      return update_game_command
        .execute(interaction)
        .catch((e) => expect(e.message).toMatch("test error"))
    })

    it("replies with an error when the game is not found", async () => {
      jest.spyOn(Games, "findOne").mockResolvedValue(null)

      const reply = await update_game_command.execute(interaction)

      expect(reply).toMatch("Something went wrong")
    })

    it("throws errors up the chain when the update goes wrong", async () => {
      jest.spyOn(game, "update").mockRejectedValue(new Error("test error"))
      jest.spyOn(Games, "findOne").mockResolvedValue(game)

      expect.assertions(1)

      return update_game_command
        .execute(interaction)
        .catch((e) => expect(e.message).toMatch("test error"))
    })
  })

  describe("with a new description and no name", () => {
    beforeEach(() => {
      interaction.command_options.name = ""
      interaction.command_options.description = "New description"
    })

    it("updates the game with the new description", async () => {
      await update_game_command.execute(interaction)
      await game.reload()

      expect(game.description).toEqual("New description")
    })

    it("does not change the name", async () => {
      await update_game_command.execute(interaction)
      await game.reload()

      expect(game.name).toEqual("Test Game")
    })

    it("clears the guild games cache", async () => {
      await update_game_command.execute(interaction)

      expect(cacheDeleteSpy).toHaveBeenCalled()
    })
  })

  describe("without a name or description", () => {
    beforeEach(() => {
      interaction.command_options.name = ""
      interaction.command_options.description = ""
    })

    it("replies with an error", async () => {
      const reply = await update_game_command.execute(interaction)

      expect(reply.content).toMatch("You need to give a new name or new description")
    })

    it("does not change the game", async () => {
      await update_game_command.execute(interaction)
      await game.reload()

      expect(game.name).toEqual("Test Game")
      expect(game.description).toEqual("Test description")
    })
  })

  describe("permissions", () => {
    it("uses the managers policy", async () => {
      expect(update_game_command.policy).toEqual(CommandPolicy)
    })
  })

  it("warns about an invalid game choice", async () => {
    interaction.command_options.game = "fiddlesticks"

    const result = await update_game_command.execute(interaction)

    expect(result.content).toMatch("There is no game")
    expect(result.content).toMatch("fiddlesticks")
  })
})

describe("data", () => {
  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", async () => {
    const command_data = update_game_command.data()

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = update_game_command.data()

    expect(command_data.name).toEqual(update_game_command.name)
  })
})

describe("help", () => {
  it("includes the command name in the output", () => {
    const help_text = update_game_command.help({command_name: "sillyness"})

    expect(help_text).toMatch("sillyness")
  })
})
