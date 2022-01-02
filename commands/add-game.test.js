const add_game_command = require("./add-game")
const { Guilds, Games } = require("../models")
const { UniqueConstraintError } = require("sequelize")
const ManagerPolicy = require("../policies/manager-policy")
const GamesForGuild = require("../caches/games-for-guild")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")

var guild
var interaction
var cacheDeleteSpy

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

    it("clears the guild's cache", async () => {
      try {
        await add_game_command.execute(interaction)
      } catch (error) {
        console.log(error)
      }

      expect(cacheDeleteSpy).toHaveBeenCalled()
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
    it("throws errors up the chain", async () => {
      jest.spyOn(Games, "create").mockRejectedValue(new Error("test error"))

      expect.assertions(1)

      return add_game_command
        .execute(interaction)
        .catch((e) => expect(e.message).toMatch("test error"))
    })
  })

  describe("permissions", () => {
    it("uses the managers policy", async () => {
      expect(add_game_command.policy).toEqual(ManagerPolicy)
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

describe("help", () => {
  it("includes the command name in the output", () => {
    const help_text = add_game_command.help({command_name: "sillyness"})

    expect(help_text).toMatch("sillyness")
  })
})
