"use strict"

const Commands = require("./commands")
const { Guilds, Games } = require("../models")

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

describe("buildCommandJSON", () => {
  beforeEach(async () => {
    try {
      await guild.reload({ include: Games })
    } catch (err) {
      console.log(err)
    }
  })

  it("returns valid json", () => {
    const result = Commands.buildCommandJSON(guild)

    expect(result).toBeTruthy()
  })
})

describe("deployToGuild", () => {
  beforeEach(() => {
    jest
      .spyOn(Commands, "restClient")
      .mockReturnValue({ put: (route, body) => new Promise.resolve(true)})
  })

  it("uses existing games if present on guild", async () => {
    await guild.reload({ include: Games })
    const reloadSpy = jest.spyOn(guild, "reload")

    await Commands.deployToGuild(guild)

    expect(reloadSpy).not.toHaveBeenCalled()
  })

  it("loads the guild games if necessary", async () => {
    const reloadSpy = jest.spyOn(guild, "reload")

    await Commands.deployToGuild(guild)

    expect(reloadSpy).toHaveBeenCalled()
  })
})

describe("deployToAllGuilds", () => {
  it("calls deployToGuild for every passed guild", async () => {
    const deploySpy = jest.spyOn(Commands, 'deployToGuild').mockResolvedValue(true)
    await guild.reload({ include: Games })

    await Commands.deployToAllGuilds([guild])

    expect(deploySpy).toHaveBeenCalledTimes(1)
  })

  it("loads all guilds if not given any", async () => {
    const findSpy = jest.spyOn(Guilds, 'findAll').mockResolvedValue([])

    await Commands.deployToAllGuilds()

    expect(findSpy).toHaveBeenCalled()
  })
})
