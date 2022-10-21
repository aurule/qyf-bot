const CommandHelpPresenter = require("./command-help-presenter")

const test_command = {
  name: "test-command",
  help: () => "test help output"
}

describe("present", () => {
  it("names the command in the output", () => {
    const result = CommandHelpPresenter.present(test_command)

    expect(result).toMatch("Showing help for")
    expect(result).toMatch(test_command.name)
  })

  it("shows the help output for the command", () => {
    const result = CommandHelpPresenter.present(test_command)

    expect(result).toMatch(test_command.help())
  })
})
