const commandsTopic = require("./commands")

describe("help", () => {
  it("shows slash command descriptions", () => {
    const help_text = commandsTopic.help()

    expect(help_text).toMatch("Set the default game for this channel")
  })

  it("shows menu command descriptions", () => {
    const help_text = commandsTopic.help()

    expect(help_text).toMatch("Append a message to your last quote")
  })

  it("shows slash command names", () => {
    const help_text = commandsTopic.help()

    expect(help_text).toMatch("set-default-game")
  })

  it("shows menu command names", () => {
    const help_text = commandsTopic.help()

    expect(help_text).toMatch("Add to quote")
  })
})
