const qyf_help_command = require("./qyf-help")

const { Interaction } = require("../testing/interaction")

var interaction

beforeEach(() => {
  interaction = new Interaction()
})

describe("execute", () => {
  describe("with a topic", () => {
    beforeEach(() => {
      interaction.command_options.command = undefined
      interaction.command_options.topic = "permissions"
    })

    it("displays the help for the topic", async () => {
      const result = await qyf_help_command.execute(interaction)

      expect(result).toMatch("restricted to users")
    })

    it("warns the user if the topic isn't found", async () => {
      interaction.command_options.topic = "unknown"

      const result = await qyf_help_command.execute(interaction)

      expect(result).toMatch("No help is available")
    })
  })

  describe("with a command", () => {
    beforeEach(() => {
      interaction.command_options.command = "test-command"
      interaction.command_options.topic = undefined
      interaction.client.commands.set("test-command", {
        name: "test-command",
        help: () => "test help",
      })
    })

    it("displays the help for the command", async () => {
      const result = await qyf_help_command.execute(interaction)

      expect(result).toMatch("test help")
    })

    it("warns the user if the command isn't found", async () => {
      interaction.command_options.command = "unknown"

      const result = await qyf_help_command.execute(interaction)

      expect(result).toMatch("No help is available")
    })
  })

  describe("with a topic and a command", () => {
    beforeEach(() => {
      interaction.command_options.command = "test-command"
      interaction.command_options.topic = "permissions"
      interaction.client.commands.set("test-command", {
        name: "test-command",
        help: () => "test help",
      })
    })

    it("displays the help for the topic", async () => {
      const result = await qyf_help_command.execute(interaction)

      expect(result).toMatch("restricted to users")
    })
  })

  describe("with no inputs", () => {
    beforeEach(() => {
      interaction.command_options.command = undefined
      interaction.command_options.topic = undefined
      interaction.client.commands.set("qyf-help", {
        name: "qyf-help",
        help: () => "test help",
      })
    })

    it("displays its own help text", async () => {
      const result = await qyf_help_command.execute(interaction)

      expect(result).toMatch("test help")
    })
  })
})

describe("dm", () => {
  it("calls execute", async () => {
    const executeMock = jest.spyOn(qyf_help_command, "execute")

    await qyf_help_command.dm(interaction)

    expect(executeMock).toHaveBeenCalled()
  })
})

describe("data", () => {
  // This test is very bare-bones because we're really just
  // testing that the various calls to discord.js functions
  // were executed properly.
  it("returns something", () => {
    const command_data = qyf_help_command.data()

    expect(command_data).toBeTruthy()
  })

  it("uses the command's name", () => {
    const command_data = qyf_help_command.data()

    expect(command_data.name).toEqual(qyf_help_command.name)
  })
})

describe("help", () => {
  it("includes the command name in the output", () => {
    const help_text = qyf_help_command.help({command_name: "sillyness"})

    expect(help_text).toMatch("sillyness")
  })
})
