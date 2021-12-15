const CommandPolicy = require("./command-policy")

const { Permissions } = require('discord.js');

describe("elevateMember", () => {
  it("returns true for guild managers", () => {
    const member = {
      permissions: new Permissions(Permissions.FLAGS.MANAGE_GUILD)
    }

    expect(CommandPolicy.elevateMember(member)).toBeTruthy()
  })

  it("returns true for channel managers", () => {
    const member = {
      permissions: new Permissions(Permissions.FLAGS.MANAGE_CHANNELS)
    }

    expect(CommandPolicy.elevateMember(member)).toBeTruthy()
  })

  it("returns false for all others", () => {
    const member = {
      permissions: new Permissions(Permissions.FLAGS.DEFAULT)
    }

    expect(CommandPolicy.elevateMember(member)).toBeFalsy()
  })
})
