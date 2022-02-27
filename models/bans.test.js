const BansModel = require("./bans")
const { Bans, Users } = require("./")

const { simpleflake } = require("simpleflakes")
const { addMinutes, subMinutes } = require("date-fns")

let user
beforeEach(async () => {
  user = await Users.create({
    name: "Test User",
    snowflake: simpleflake().toString(),
  })
})

afterEach(async () => {
  await Bans.destroy({ where: { bannableType: "Users", bannableId: user.id } })
  await user.destroy()
})

describe("scopes", () => {
  describe("active", () => {
    it("includes bans with a null expiresAt", async () => {
      const ban = await user.createBan({
        reason: "test ban",
        expiresAt: null,
      })

      const bans = await Bans.scope("active").findAll()
      const banIds = bans.map(b => b.id)

      expect(banIds).toEqual(expect.arrayContaining([ban.id]))
    })

    it("includes bans with a future expiresAt", async () => {
      const ban = await user.createBan({
        reason: "test ban",
        expiresAt: addMinutes(new Date(), 15),
      })

      const bans = await Bans.scope("active").findAll()
      const banIds = bans.map(b => b.id)

      expect(banIds).toEqual(expect.arrayContaining([ban.id]))
    })
  })

  describe("expired", () => {
    it("excludes bans with a null expiresAt", async () => {
      const ban = await user.createBan({
        reason: "test ban",
        expiresAt: null,
      })

      const bans = await Bans.scope("expired").findAll()
      const banIds = bans.map(b => b.id)

      expect(banIds).not.toEqual(expect.arrayContaining([ban.id]))
    })

    it("includes bans with a past expiresAt", async () => {
      const ban = await user.createBan({
        reason: "test ban",
        expiresAt: subMinutes(new Date(), 15),
      })

      const bans = await Bans.scope("expired").findAll()
      const banIds = bans.map(b => b.id)

      expect(banIds).toEqual(expect.arrayContaining([ban.id]))
    })
  })
})
