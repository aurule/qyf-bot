const BannedPolicy = require("./banned-policy")
const { Bans, Users } = require("../models")

const { Interaction } = require("../testing/interaction")
const { simpleflake } = require("simpleflakes")
const { addMinutes, subMinutes } = require("date-fns")

let user
let interaction

describe("allow", () => {
  beforeEach(async () => {
    interaction = new Interaction()
    user = await Users.create({
      name: "Test User",
      snowflake: interaction.user.id.toString()
    })
  })

  afterEach(async () => {
    await Bans.destroy({where: {bannableType: "Users", bannableId: user.id}})
    await user.destroy()
  })

  it("returns true if the user has no bans", async () => {
    const result = await BannedPolicy.allow(interaction)

    expect(result).toBeTruthy()
  })

  it("returns true if the user has only expired bans", async () => {
    await user.createBan({
      reason: "testing bans",
      expiresAt: subMinutes(new Date(), 15)
    })

    const result = await BannedPolicy.allow(interaction)

    expect(result).toBeTruthy()
  })

  it("returns false if the user has any active bans", async () => {
    await user.createBan({
      reason: "testing bans",
      expiresAt: addMinutes(new Date(), 15)
    })

    const result = await BannedPolicy.allow(interaction)

    expect(result).toBeFalsy()
  })
})
