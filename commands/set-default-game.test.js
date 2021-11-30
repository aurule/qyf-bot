"use strict"

const set_default_game_command = require("./set-default-game")
const { Guilds, Games } = require("../models")
const { keyv } = require("../util/keyv.js")
const GameSelectTransformer = require("../transformers/game-select-transformer")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")
const { explicitScope } = require("../services/default-game-scope")

var guild
var interaction

beforeEach(async () => {
  try {
    guild = await Guilds.create({
      name: "Test Guild",
      snowflake: simpleflake().toString(),
    })
    interaction = new Interaction(guild.snowflake)
    interaction.channel.id = simpleflake().toString()
    interaction.channel.guild = { id: guild.snowflake, name: guild.name }
    interaction.channel.name = "test channel"
    interaction.command_options["server"] = false
  } catch (err) {
    console.log(err)
  }
})

afterEach(async () => {
  try {
    await Games.destroy({ where: { guildId: guild.id } })
    await guild.destroy()
  } catch (err) {
    console.log(err)
  }
})

it("stores options", async () => {
  const keyvSpy = jest.spyOn(keyv, "set")
  const expectedScope = explicitScope(interaction.channel, false)

  await set_default_game_command.execute(interaction)

  expect(keyvSpy).toHaveBeenCalledWith(interaction.id.toString(), expectedScope)
})

describe("reply", () => {
  it("includes an action row", async () => {
    const reply = await set_default_game_command.execute(interaction)

    expect(reply.components).not.toBeFalsy()
  })

  it("shows a select for the guild's games", async () => {
    const game = await Games.create({
      name: "test game",
      guildId: guild.id,
    })
    const transformSpy = jest.spyOn(GameSelectTransformer, "transform")

    const reply = await set_default_game_command.execute(interaction)
    const selectOptions = reply.components[0].components[0].options

    expect(selectOptions[0].label).toEqual(game.name)
  })
})
