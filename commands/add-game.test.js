const add_game_command = require("./add-game")
const { Guilds, Games } = require("../models")
const { UniqueConstraintError } = require("sequelize")
const Commands = require("../services/commands")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")

var guild
var interaction
var commandSpy

beforeEach(async () => {
  try {
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: simpleflake().toString(),
    })
    interaction = new Interaction(guild.snowflake)
  } catch (err) {
    console.log(err)
  }

  interaction.command_options.name = "new game"
  interaction.command_options.description = "a new game"

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
  describe("without errors", () => {
    it("creates a new game", async () => {
      const spy = jest.spyOn(Games, "create")

      try {
        await add_game_command.execute(interaction)
      } catch (error) {
        console.log(error)
      }

      expect(spy).toHaveBeenCalledWith({
        name: "new game",
        guildId: guild.id,
        description: "a new game",
      })
    })

    it("replies that the game was added", async () => {
      const reply = await add_game_command.execute(interaction)

      expect(reply).toMatch('Added game "new game"')
    })

    it("updates the guild's commands", async () => {
      try {
        await add_game_command.execute(interaction)
      } catch (error) {
        console.log(error)
      }

      expect(commandSpy).toHaveBeenCalled()
    })
  })

  describe("with a duplicate name", () => {
    it("replies that the game already exists", async () => {
      jest.spyOn(Games, "create").mockImplementation(async (args) => {
        throw new UniqueConstraintError()
      })

      const reply = await add_game_command.execute(interaction)

      expect(reply).toMatch('The game "new game" already exists!')
    })
  })

  describe("with an error", () => {
    it("replies with a boring message", async () => {
      jest.spyOn(Games, "create").mockImplementation(async (args) => {
        throw new Error("test error")
      })

      const reply = await add_game_command.execute(interaction)

      expect(reply).toMatch("Something went wrong :-(")
    })
  })
})

describe("data", () => {
  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", () => {
    const command_data = add_game_command.data({})

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = add_game_command.data(guild)

    expect(command_data.name).toEqual(add_game_command.name)
  })
})
