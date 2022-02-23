const { getReplyFn } = require("./getReplyFn")

const { Interaction } = require("../testing/interaction")

var interaction

beforeEach(() => {
  interaction = new Interaction()
})

describe("getReplyFn", () => {
  it("interaction is untouched: reply", () => {
    interaction.replied = false
    interaction.deferred = false

    const fn = getReplyFn(interaction)

    expect(fn).toEqual("reply")
  })

  it("interaction is replied and deferred: followUp", () => {
    interaction.replied = true
    interaction.deferred = true

    const fn = getReplyFn(interaction)

    expect(fn).toEqual("followUp")
  })

  it("interaction is replied and not deferred: followUp", () => {
    interaction.replied = true
    interaction.deferred = false

    const fn = getReplyFn(interaction)

    expect(fn).toEqual("followUp")
  })

  it("interaction is not replied, but is deferred: editReply", () => {
    interaction.replied = false
    interaction.deferred = true

    const fn = getReplyFn(interaction)

    expect(fn).toEqual("editReply")
  })
})
