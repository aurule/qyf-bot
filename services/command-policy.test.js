const CommandPolicy = require("./command-policy")

const { Permissions } = require('discord.js');

describe("allow", () => {
  it("returns true for guild managers", () => {
    const member = {
      permissions: new Permissions(Permissions.FLAGS.MANAGE_GUILD)
    }

    expect(CommandPolicy.allow({member})).toBeTruthy()
  })

  it("returns true for channel managers", () => {
    const member = {
      permissions: new Permissions(Permissions.FLAGS.MANAGE_CHANNELS)
    }

    expect(CommandPolicy.allow({member})).toBeTruthy()
  })

  it("returns false for all others", () => {
    const member = {
      permissions: new Permissions(Permissions.FLAGS.DEFAULT)
    }

    expect(CommandPolicy.allow({member})).toBeFalsy()
  })
})
