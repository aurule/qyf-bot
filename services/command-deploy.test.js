"use strict"

const commandService = require("./command-deploy")
const { Guilds, Games } = require("../models")
const { Routes } = require("discord-api-types/v9")

const { simpleflake } = require("simpleflakes")

var guild
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
})

afterEach(async () => {
  try {
    await Games.destroy({ where: { guildId: guild.id } })
    await guild.destroy()
  } catch (err) {
    console.log(err)
  }
})

describe("buildGuildCommandJSON", () => {
  beforeEach(async () => {
    try {
      await guild.reload({ include: Games })
    } catch (err) {
      console.log(err)
    }
  })

  it("returns valid json", () => {
    const result = commandService.buildGuildCommandJSON(guild)

    expect(result).toBeTruthy()
  })
})

describe("deployToGuild", () => {
  beforeEach(() => {
    jest
      .spyOn(commandService, "restClient")
      .mockReturnValue({ put: (route, body) => new Promise.resolve(true) })
  })

  it("uses existing games if present on guild", async () => {
    await guild.reload({ include: Games })
    const reloadSpy = jest.spyOn(guild, "reload")

    await commandService.deployToGuild(guild)

    expect(reloadSpy).not.toHaveBeenCalled()
  })

  it("loads the guild games if necessary", async () => {
    const reloadSpy = jest.spyOn(guild, "reload")

    await commandService.deployToGuild(guild)

    expect(reloadSpy).toHaveBeenCalled()
  })
})

describe("deployToAllGuilds", () => {
  it("calls deployToGuild for every passed guild", async () => {
    const deploySpy = jest
      .spyOn(commandService, "deployToGuild")
      .mockResolvedValue(true)
    await guild.reload({ include: Games })

    await commandService.deployToAllGuilds([guild])

    expect(deploySpy).toHaveBeenCalledTimes(1)
  })

  it("loads all guilds if not given any", async () => {
    const findSpy = jest.spyOn(Guilds, "findAll").mockResolvedValue([])

    await commandService.deployToAllGuilds()

    expect(findSpy).toHaveBeenCalled()
  })
})

describe("buildGlobalCommandJSON", () => {
  it("returns valid json", () => {
    const result = commandService.buildGlobalCommandJSON()

    expect(result).toBeTruthy()
  })
})

describe("deployGlobals", () => {
  beforeEach(() => {
    jest
      .spyOn(commandService, "restClient")
      .mockReturnValue({ put: (route, body) => new Promise.resolve(true) })
  })

  it("sends the commands", async () => {
    const routeSpy = jest.spyOn(Routes, "applicationCommands").mockReturnValue("/")

    const result = await commandService.deployGlobals()

    expect(routeSpy).toHaveBeenCalled()
  })
})
