"use strict"

const remove_default_game_command = require("./remove-default-game")
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
    interaction.channel.id = simpleflake()
    interaction.channel.guild = { id: guild.snowflake, name: guild.name }
    interaction.channel.name = "Test Channel"
    interaction.command_options["server"] = false
  } catch (err) {
    console.log(err)
  }
})

afterEach(async () => {
  try {
    const games = await Games.findAll({ where: { guildId: guild.id } })
    await DefaultGames.destroy({ where: { gameId: games.map((g) => g.id) } })
    await Games.destroy({ where: { guildId: guild.id } })
    await guild.destroy()
  } catch (err) {
    console.log(err)
  }
})

describe("execute", () => {
  it("gets the scope for the optioned channel", async () => {
    const target_channel = { id: simpleflake(), name: "other channel" }
    interaction.command_options["channel"] = target_channel

    const reply = await remove_default_game_command.execute(interaction)

    expect(reply).toMatch(target_channel.name)
  })

  it("gets the scope for the current channel when no explicit option", async () => {
    const reply = await remove_default_game_command.execute(interaction)

    expect(reply).toMatch(interaction.channel.name)
  })

  it("does nothing if there is no default for the scope snowflake", async () => {
    const wrong_game = await Games.create({
      name: "Wrong Game",
      guildId: guild.id,
    })
    const default_game = await DefaultGames.create({
      snowflake: guild.snowflake,
      gameId: wrong_game.id,
      type: DefaultGames.TYPE_GUILD,
      name: "Test Guild",
    })

    await remove_default_game_command.execute(interaction)
    const post_delete_find = await DefaultGames.findByPk(default_game.id)

    expect(post_delete_find).toBeTruthy()
  })

  it("removes the default game for the provided snowflake", async () => {
    const right_game = await Games.create({
      name: "Right Game",
      guildId: guild.id,
    })
    const default_game = await DefaultGames.create({
      snowflake: interaction.channel.id.toString(),
      gameId: right_game.id,
      type: DefaultGames.TYPE_CHANNEL,
      name: "Test Channel",
    })

    await remove_default_game_command.execute(interaction)
    const post_delete_find = await DefaultGames.findByPk(default_game.id)

    expect(post_delete_find).toBeFalsy()
  })

  it("notifies the user", async () => {
    const result = await remove_default_game_command.execute(interaction)

    expect(result).toMatch("Removed default game from Test Channel")
  })
})

describe("data", () => {
  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", () => {
    const command_data = remove_default_game_command.data({})

    expect(command_data).toBeTruthy()
  })
})
