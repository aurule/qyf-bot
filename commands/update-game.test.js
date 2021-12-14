const update_game_command = require("./update-game")
const { Guilds, Games } = require("../models")
const { UniqueConstraintError } = require("sequelize")
const Commands = require("../services/commands")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")

var guild
var game
var interaction
var commandSpy

beforeEach(async () => {
  try {
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: simpleflake().toString(),
    })
    game = await Games.create({
      name: "Test Game",
      description: "Test description",
      guildId: guild.id
    })
    interaction = new Interaction(guild.snowflake)
  } catch (err) {
    console.log(err)
  }

  interaction.command_options.game = game.id
  interaction.command_options.name = ""
  interaction.command_options.description = ""

  commandSpy = jest.spyOn(Commands, "deployToGuild").mockImplementation(async (guild) => true)
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

    it("redeploys guild commands", async () => {
      await update_game_command.execute(interaction)

      expect(commandSpy).toHaveBeenCalled()
    })

    it("replies with the updated game info", async () => {
      const reply = await update_game_command.execute(interaction)
      await game.reload()

      expect(reply).toMatch(game.name)
    })

    it("replies with an error when the game throws", async () => {
      jest.spyOn(Games, 'findOne').mockRejectedValue(new Error("test error"))

      const reply = await update_game_command.execute(interaction)

      expect(reply).toMatch("Something went wrong")
    })

    it("replies with an error when the guild throws", async () => {
      jest.spyOn(Guilds, 'findByInteraction').mockRejectedValue(new Error("test error"))

      const reply = await update_game_command.execute(interaction)

      expect(reply).toMatch("Something went wrong")
    })

    it("replies with an error when the game is not found", async () => {
      jest.spyOn(Games, 'findOne').mockResolvedValue(null)

      const reply = await update_game_command.execute(interaction)

      expect(reply).toMatch("Something went wrong")
    })

    it("replies with an error when the update goes wrong", async () => {
      jest.spyOn(game, 'update').mockRejectedValue(new Error("test error"))
      jest.spyOn(Games, 'findOne').mockResolvedValue(game)

      const reply = await update_game_command.execute(interaction)

      expect(reply).toMatch("Something went wrong")
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
  })

  describe("without a name or description", () => {
    beforeEach(() => {
      interaction.command_options.name = ""
      interaction.command_options.description = ""
    })

    it("replies with an error", async () => {
      const reply = await update_game_command.execute(interaction)

      expect(reply).toMatch("You need to give a new name or new description")
    })

    it("does not change the game", async () => {
      await update_game_command.execute(interaction)
      await game.reload()

      expect(game.name).toEqual("Test Game")
      expect(game.description).toEqual("Test description")
    })
  })
})

describe("data", () => {
  beforeEach(async () => {
    await Games.bulkCreate(
      [
        {name: "Test Game 1", guildId: guild.id},
        {name: "Test Game 2", guildId: guild.id},
      ]
    )
    await guild.reload({include: Games})
  })

  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", async () => {
    const command_data = update_game_command.data(guild)

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = update_game_command.data(guild)

    expect(command_data.name).toEqual(update_game_command.name)
  })
})