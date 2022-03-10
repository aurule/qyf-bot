const CommandNamePresenter = require("./command-name-presenter")

const test_command = {
  name: "test-command",
  help: () => "test help output"
}

describe("present", () => {
  it("with a menu command, it uses the name directly", () => {
    const result = CommandNamePresenter.present({type: "menu", ...test_command})

    expect(result).toEqual(`_${test_command.name}_`)
  })

  it("with a slash command, it prefixes the name with a slash", () => {
    const result = CommandNamePresenter.present(test_command)

    expect(result).toEqual(`\`/${test_command.name}\``)

  })
})
