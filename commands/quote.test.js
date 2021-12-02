"use strict"

const quote_command = require("./quote")
const { Guilds, Games, DefaultGames } = require("../models")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")

var guild
var interaction

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

  interaction.command_options.text = "Text of the quote"
  interaction.command_options.speaker = {}
  interaction.command_options.alias = "Dude Bro"
})

afterEach(async () => {
  try {
    await Games.destroy({ where: { guildId: guild.id } })
    await guild.destroy()
  } catch (err) {
    console.log(err)
  }
})

describe("with a default game", () => {
  it.todo("saves the quote for the default game")

  describe("reply", () => {
    it.todo("says who saved the quote")

    it("displays the quote and speaker", async () => {
      const reply = await quote_command.execute(interaction)

      expect(reply).toMatch(interaction.command_options.text)
      expect(reply).toMatch(interaction.command_options.alias)
    })
  })
})

describe("with no default game", () => {
  it.todo("stores the quote info for later followup")

  it.todo("replies with a game prompt")
})
