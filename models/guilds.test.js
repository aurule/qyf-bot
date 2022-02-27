const GuildsModel = require("./guilds")
const GamesModel = require("./games")
const { sequelize, Guilds, Games } = require("./")
const { Op } = require("sequelize")

const { simpleflake } = require("simpleflakes")

describe("findByInteraction", () => {
  var findSpy

  beforeEach(() => {
    findSpy = jest.spyOn(Guilds, "findOne")
  })

  it("searches for the snowflake from the interaction", async () => {
    const interaction = {
      guildId: "12345",
    }

    await Guilds.findByInteraction(interaction)

    expect(findSpy).toHaveBeenCalledWith({ where: { snowflake: "12345" } })
  })

  it("passes options through", async () => {
    const interaction = {
      guildId: "12345",
    }

    await Guilds.findByInteraction(interaction, {test: "yes"})

    expect(findSpy).toHaveBeenCalledWith({ where: { snowflake: "12345" }, test: "yes" })
  })
})

describe("findBySnowflake", () => {
  var findSpy

  beforeEach(() => {
    findSpy = jest.spyOn(Guilds, "findOne")
  })

  it("searches for the snowflake", async () => {
    await Guilds.findBySnowflake("12345")

    expect(findSpy).toHaveBeenCalledWith({ where: { snowflake: "12345" } })
  })

  it("passes options through", async () => {
    await Guilds.findBySnowflake("12345", {test: "yes"})

    expect(findSpy).toHaveBeenCalledWith({ where: { snowflake: "12345" }, test: "yes" })
  })

  it("returns null with a missing snowflake", async () => {
    const result = await Guilds.findBySnowflake()

    expect(result).toBeNull()
  })
})

describe("getGamesByPartialName", () => {
  // All of these have to use case-sensitive matching, since tests are run in
  // sqlite for ease of development
  //
  // Is that a bad decision? Yes.
  // It is causing weird problems? Yes.
  // Will I change it? No. Maybe. Not yet.

  let guild
  beforeEach(async () => {
    guild = await Guilds.create({ name: "Test Guild", snowflake: simpleflake().toString() })
  })

  afterEach(async () => {
    await Games.destroy({ where: { guildId: guild.id } })
    await guild.destroy()
  })

  it("returns empty array with no matches", async () => {
    await guild.createGame({ name: "Not Matching" })

    const result = await guild.getGamesByPartialName("failure")

    expect(result).toEqual([])
  })

  it("returns array of partial matches", async () => {
    const game = await guild.createGame({ name: "Yes Matching" })

    const result = await guild.getGamesByPartialName("Yes")

    expect(result[0].id).toEqual(game.id)
  })

  it("returns array of full matches", async () => {
    const game = await guild.createGame({ name: "Yes Matching" })

    const result = await guild.getGamesByPartialName("Yes Matching")

    expect(result[0].id).toEqual(game.id)
  })
})
