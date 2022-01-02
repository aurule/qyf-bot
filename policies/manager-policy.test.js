const ManagerPolicy = require("./manager-policy")

const { Permissions } = require('discord.js');

describe("allow", () => {
  it("returns true for guild managers", () => {
    const member = {
      permissions: new Permissions(Permissions.FLAGS.MANAGE_GUILD)
    }

    expect(ManagerPolicy.allow({member})).toBeTruthy()
  })

  it("returns true for channel managers", () => {
    const member = {
      permissions: new Permissions(Permissions.FLAGS.MANAGE_CHANNELS)
    }

    expect(ManagerPolicy.allow({member})).toBeTruthy()
  })

  it("returns false for all others", () => {
    const member = {
      permissions: new Permissions(Permissions.FLAGS.DEFAULT)
    }

    expect(ManagerPolicy.allow({member})).toBeFalsy()
  })
})
