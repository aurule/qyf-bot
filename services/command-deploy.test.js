"use strict"

const commandService = require("./command-deploy")
const { Routes } = require("discord-api-types/v9")

describe("buildGlobalCommandJSON", () => {
  it("returns valid json", () => {
    const result = commandService.buildGlobalCommandJSON()

    expect(result).toBeTruthy()
  })
})

describe("hashGlobalCommandJSON", () => {
  it("returns a string hash", () => {
    const result = commandService.hashGlobalCommandJSON()

    expect(typeof result).toEqual("string")
  })

  it("gives a different hash with different json", () => {
    jest.spyOn(commandService, "buildGlobalCommandJSON")
      .mockReturnValueOnce("abcdefg")
      .mockReturnValueOnce("bbcdefg")
    const first_result = commandService.hashGlobalCommandJSON()
    const second_result = commandService.hashGlobalCommandJSON()

    expect(first_result).not.toEqual(second_result)
  })
})

describe("deployGlobals", () => {
  beforeEach(() => {
    jest
      .spyOn(commandService, "restClient")
      .mockReturnValue({ put: (route, body) => new Promise.resolve(true) })
  })

  it("sends the commands", async () => {
    const routeSpy = jest.spyOn(Routes, "applicationCommands").mockReturnValue("/")

    const result = await commandService.deployGlobals()

    expect(routeSpy).toHaveBeenCalled()
  })

  it("with a matching hash, skips deploy", async () => {
    jest.spyOn(commandService, "hashGlobalCommandJSON").mockReturnValue("testhash")
    const routeSpy = jest.spyOn(Routes, "applicationCommands").mockReturnValue("/")

    const result = await commandService.deployGlobals("testhash")

    expect(routeSpy).not.toHaveBeenCalled()
  })
})
