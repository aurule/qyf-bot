"use strict"

const set_default_game_command = require("./set-default-game")
const { Guilds, Games, DefaultGames } = require("../models")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")

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
  } catch (err) {
    console.log(err)
  }

  interaction = new Interaction(guild.snowflake)
  interaction.channel.id = simpleflake().toString()
  interaction.channel.guild = { id: guild.snowflake, name: guild.name }
  interaction.channel.name = "test channel"
  interaction.command_options["server"] = false
  interaction.command_options["game"] = game.name
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

    const reply = await set_default_game_command.execute(interaction)

    expect(reply).toMatch(target_channel.id.toString())
  })

  it("gets the scope for the current channel when no explicit option", async () => {
    const reply = await set_default_game_command.execute(interaction)

    expect(reply).toMatch(interaction.channel.id.toString())
  })

  it("updates an existing default game record if one exists", async () => {
    const game2 = await Games.create({
      name: "second game",
      guildId: guild.id,
    })
    const record = await DefaultGames.create({
      name: "test channel",
      gameId: game2.id,
      type: DefaultGames.TYPE_CHANNEL,
      snowflake: interaction.channel.id.toString(),
    })

    await set_default_game_command.execute(interaction)

    await record.reload()
    expect(record.gameId).toEqual(game.id)
  })

  it("creates a new default game record if none exists", async () => {
    await set_default_game_command.execute(interaction)

    const record = await DefaultGames.findOne({
      where: { snowflake: interaction.channel.id },
    })

    expect(record).toBeTruthy()
  })

  it("warns about an invalid game choice", async () => {
    interaction.command_options.game = "fiddlesticks"

    const result = await set_default_game_command.execute(interaction)

    expect(result).toMatch("There is no game")
    expect(result).toMatch("fiddlesticks")
  })

  it("works with a game from the completer", async () => {
    interaction.partial_text = game.name
    const completer = set_default_game_command.autocomplete.get("game")
    const game_arg = await completer.complete(interaction).then((values) => values[0].value)
    interaction.command_options.game = game_arg

    await set_default_game_command.execute(interaction)

    const record = await DefaultGames.findOne({
      where: { snowflake: interaction.channel.id },
    })
    expect(record.gameId).toEqual(game.id)
  })

  it("gets a game by partial name", async () => {
    interaction.command_options.game = "Test"

    await set_default_game_command.execute(interaction)

    const record = await DefaultGames.findOne({
      where: { snowflake: interaction.channel.id },
    })
    expect(record.gameId).toEqual(game.id)
  })

  describe("reply", () => {
    it("replies that the game was set as default", async () => {
      const reply = await set_default_game_command.execute(interaction)

      expect(reply).toMatch("Test Game is now the default")
    })

    it("throws errors up the chain", async () => {
      jest.spyOn(DefaultGames, "upsert").mockRejectedValue(new Error("test error"))

      expect.assertions(1)

      return set_default_game_command
        .execute(interaction)
        .catch((e) => expect(e.message).toMatch("test error"))
    })
  })
})

describe("data", () => {
  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", async () => {
    const command_data = set_default_game_command.data(guild)

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = set_default_game_command.data(guild)

    expect(command_data.name).toEqual(set_default_game_command.name)
  })
})

describe("help", () => {
  it("includes the command name in the output", () => {
    const help_text = set_default_game_command.help({command_name: "sillyness"})

    expect(help_text).toMatch("sillyness")
  })
})
