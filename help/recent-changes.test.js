const changesTopic = require("./recent-changes")
const { version } = require("../package.json")

describe("getChangelog", () => {
  it("reads changelog file when present", () => {
    const changelog = changesTopic.getChangelog("1.0.0").toString()

    expect(changelog).toMatch("Improved error messages")
  })

  it("returns no changelog message when no changelog exists", () => {
    const changelog = changesTopic.getChangelog("0.5.0").toString()

    expect(changelog).toMatch("no changelog for 0.5.0")
  })
})

describe("help", () => {
  it("shows the current version", () => {
    const result = changesTopic.help()

    expect(result).toMatch(version)
  })

  it("links to old changelogs", () => {
    const result = changesTopic.help()

    expect(result).toMatch("github.com")
  })
})
