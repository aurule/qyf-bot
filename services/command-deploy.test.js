"use strict"

const commandService = require("./command-deploy")
const { Routes } = require("discord-api-types/v9")

describe("buildGlobalCommandJSON", () => {
  it("returns valid json", () => {
    const result = commandService.buildGlobalCommandJSON()

    expect(result).toBeTruthy()
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
})
