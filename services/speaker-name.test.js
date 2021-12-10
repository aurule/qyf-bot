"use strict"

const speaker_name_service = require("./speaker-name")

describe("determineName", () => {
  it("returns alias if present", () => {
    const result = speaker_name_service.determineName({
      username: "The Username",
      nickname: "The Nickname",
      alias: "The Alias",
    })

    expect(result).toEqual("The Alias")
  })

  it("returns nickname present without alias", () => {
    const result = speaker_name_service.determineName({
      username: "The Username",
      nickname: "The Nickname",
    })

    expect(result).toEqual("The Nickname")
  })
  it("returns username if nothing else is present", () => {
    const result = speaker_name_service.determineName({
      username: "The Username",
    })

    expect(result).toEqual("The Username")
  })
})
