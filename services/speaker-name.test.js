"use strict"

const speaker_name_service = require("./speaker-name")

describe("determineName", () => {
  it("returns alias if present", () => {
    const result = speaker_name_service.determineName("The Username", "The Nickname", "The Alias")

    expect(result).toEqual("The Alias")
  })

  it("returns nickname present without alias", () => {
    const result = speaker_name_service.determineName("The Username", "The Nickname", null)

    expect(result).toEqual("The Nickname")
  })
  it("returns username if nothing else is present", () => {
    const result = speaker_name_service.determineName("The Username", null, null)

    expect(result).toEqual("The Username")
  })
})
