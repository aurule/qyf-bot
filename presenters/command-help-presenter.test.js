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

  it("with a menu command, it uses the name directly", () => {
    const result = CommandHelpPresenter.present({type: "menu", ...test_command})

    expect(result).toMatch(test_command.name)
  })

  it("with a slash command, it prefixes the name with a slash", () => {
    const result = CommandHelpPresenter.present(test_command)

    expect(result).toMatch(`/${test_command.name}`)

  })

  it("shows the help output for the command", () => {
    const result = CommandHelpPresenter.present(test_command)

    expect(result).toMatch(test_command.help())
  })

  it("notes when a command can be used in DMs", () => {
    const dm_command = {
      ...test_command,
      dm: () => "yes",
    }
    const result = CommandHelpPresenter.present(dm_command)

    expect(result).toMatch("can be used in DMs")
  })

  it("does not warn about commands which cannot be used in DMs", () => {
    const result = CommandHelpPresenter.present(test_command)

    expect(result).not.toMatch("can be used in DMs")
  })
})
