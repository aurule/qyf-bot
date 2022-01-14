const InteractionCreateEvent = require("./interactionCreate")
const { logger } = require("../util/logger")
const { Collection } = require("discord.js")

const { Interaction } = require("../testing/interaction")

var interaction
var envSpy

beforeEach(() => {
  interaction = new Interaction()
})

describe("execute", () => {
  var handleSpy

  beforeEach(() => {
    envSpy = jest.spyOn(InteractionCreateEvent, "inCorrectEnv").mockReturnValue(true)
  })

  it("aborts when not in correct env", () => {
    envSpy.mockReturnValue(false)

    return expect(InteractionCreateEvent.execute(interaction)).resolves.toMatch(
      "wrong guild for env"
    )
  })

  describe("dispatches commands", () => {
    beforeEach(() => {
      interaction.interactionType = "command"
      handleSpy = jest.spyOn(InteractionCreateEvent, "handleCommand")
    })

    it("executes commands", () => {
      handleSpy.mockResolvedValue("worked")

      return expect(
        InteractionCreateEvent.execute(interaction)
      ).resolves.toMatch("worked")
    })

    it("executes application commands", () => {
      interaction.interactionType = "applicationCommand"
      handleSpy.mockResolvedValue("worked")

      return expect(
        InteractionCreateEvent.execute(interaction)
      ).resolves.toMatch("worked")
    })

    it("gracefully handles command errors", async () => {
      handleSpy.mockRejectedValue("failed")

      const result = await InteractionCreateEvent.execute(interaction)

      expect(result.content).toMatch("There was an error")
    })
  })

  describe("dispatches select menus", () => {
    beforeEach(() => {
      interaction.interactionType = "selectMenu"
      handleSpy = jest.spyOn(InteractionCreateEvent, "handleSelectMenu")
    })

    it("executes select menus", () => {
      handleSpy.mockResolvedValue("worked")

      return expect(
        InteractionCreateEvent.execute(interaction)
      ).resolves.toMatch("worked")
    })
    it("gracefully handles select menu errors", async () => {
      handleSpy.mockRejectedValue("ƒailed")

      const result = await InteractionCreateEvent.execute(interaction)

      expect(result.content).toMatch("There was an error")
    })
  })

  describe("dispatches autocompletes", () => {
    beforeEach(() => {
      interaction.interactionType = "autocomplete"
      handleSpy = jest.spyOn(InteractionCreateEvent, "handleAutocomplete")
    })

    it("executes autocompletes", () => {
      handleSpy.mockResolvedValue("worked")

      return expect(
        InteractionCreateEvent.execute(interaction)
      ).resolves.toMatch("worked")
    })

    it("gracefully handles autocomplete errors", async () => {
      handleSpy.mockRejectedValue("failed")

      const result = await InteractionCreateEvent.execute(interaction)

      expect(result).toEqual([])
    })
  })
})

describe("inCorrectEnv", () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }
  })

  afterAll(() => {
    process.env = OLD_ENV
  })

  describe("in development mode", () => {
    beforeEach(() => {
      process.env.NODE_ENV = "development"
    })

    it("true for dev guilds", () => {
      process.env.DEV_GUILDS = "[12345]"
      interaction.guildId = "12345"

      expect(InteractionCreateEvent.inCorrectEnv(interaction)).toBeTruthy()
    })

    it("false for all other guilds", () => {
      process.env.DEV_GUILDS = "[12345]"
      interaction.guildId = "09876"

      expect(InteractionCreateEvent.inCorrectEnv(interaction)).toBeFalsy()
    })
  })
  describe("in non-development mode", () => {
    it("false for dev guilds", () => {
      process.env.DEV_GUILDS = "[12345]"
      interaction.guildId = "12345"

      expect(InteractionCreateEvent.inCorrectEnv(interaction)).toBeFalsy()
    })

    it("true for all other guilds", () => {
      process.env.DEV_GUILDS = "[12345]"
      interaction.guildId = "09876"

      expect(InteractionCreateEvent.inCorrectEnv(interaction)).toBeTruthy()
    })
  })
})

describe("handleCommand", () => {
  const testCommand = {
    execute: (interaction) => "worked",
  }

  beforeEach(() => {
    interaction.client.commands.set("testing", testCommand)
    interaction.commandName = "testing"
    envSpy = jest.spyOn(InteractionCreateEvent, "inCorrectEnv").mockReturnValue(true)
  })

  it("rejects on unknown command", () => {
    interaction.commandName = "nope"

    return expect(
      InteractionCreateEvent.handleCommand(interaction)
    ).rejects.toMatch("no command")
  })

  describe("when command has no policy", () => {
    it("executes the command", () => {
      return expect(
        InteractionCreateEvent.handleCommand(interaction)
      ).resolves.toMatch("worked")
    })
  })

  describe("when command has a policy", () => {
    afterEach(() => {
      testCommand.policy = undefined
    })

    it("executes the command when the policy allows", () => {
      testCommand.policy = {
        allow: (interaction) => true,
      }

      return expect(
        InteractionCreateEvent.handleCommand(interaction)
      ).resolves.toMatch("worked")
    })

    it("replies with the policy error message when the policy disallows", () => {
      testCommand.policy = {
        allow: (interaction) => false,
        errorMessage: "not allowed",
      }

      return expect(
        InteractionCreateEvent.handleCommand(interaction)
      ).resolves.toMatchObject({ content: "not allowed" })
    })
  })

  describe("when command is in a DM", () => {
    beforeEach(() => {
      interaction.guild = null
    })

    afterEach(() => {
      testCommand.dm = undefined
    })

    it("runs the command's dm method if present", () => {
      testCommand.dm = function (interaction) { return "DM worked" }

      return expect(
        InteractionCreateEvent.handleCommand(interaction)
      ).resolves.toMatch("DM worked")
    })

    it("replies with an error if the command has no dm method", () => {
      return expect(
        InteractionCreateEvent.handleCommand(interaction)
      ).resolves.toMatchObject({content: "This command does not work in DMs. Sorry!"})
    })
  })
})

describe("handleSelectMenu", () => {
  const testFollowup = {
    execute: (interaction) => "worked",
  }

  beforeEach(() => {
    interaction.client.followups.set("testing", testFollowup)
    envSpy = jest.spyOn(InteractionCreateEvent, "inCorrectEnv").mockReturnValue(true)
  })

  it("rejects on unknown followup", () => {
    interaction.customId = "nope"

    return expect(
      InteractionCreateEvent.handleSelectMenu(interaction)
    ).rejects.toMatch("no followup")
  })

  it("executes the followup", () => {
    interaction.customId = "testing"

    return expect(
      InteractionCreateEvent.handleSelectMenu(interaction)
    ).resolves.toMatch("worked")
  })
})

describe("handleAutocomplete", () => {
  const testAutocomplete = {
    complete: (interaction) => "worked",
  }

  const testCommand = {
    autocomplete: new Collection(),
  }

  beforeEach(() => {
    interaction.client.commands.set("testing", testCommand)
    testCommand.autocomplete.set("testOption", testAutocomplete)
    envSpy = jest.spyOn(InteractionCreateEvent, "inCorrectEnv").mockReturnValue(true)
  })

  it("rejects on unknown command", () => {
    interaction.commandName = "nope"

    return expect(
      InteractionCreateEvent.handleAutocomplete(interaction)
    ).rejects.toMatch("no command")
  })

  it("rejects if no completer registered for the current option", () => {
    interaction.commandName = "testing"
    testCommand.autocomplete.delete("testOption")

    return expect(
      InteractionCreateEvent.handleAutocomplete(interaction)
    ).rejects.toMatch("no autocomplete")
  })

  it("executes the completer", () => {
    interaction.commandName = "testing"
    interaction.focused_option = "testOption"

    return expect(
      InteractionCreateEvent.handleAutocomplete(interaction)
    ).resolves.toMatch("worked")
  })
})
