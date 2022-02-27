const GuildsModel = require("./guilds")
const { Guilds } = require("./")

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
