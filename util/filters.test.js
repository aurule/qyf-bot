const filters = require("./filters")

describe("jsNoTests", () => {
  it("returns true for .js filenames", () => {
    const result = filters.jsNoTests("test script.js")

    expect(result).toBeTruthy()
  })

  it("returns false for non-.js filenames", () => {
    const result = filters.jsNoTests("test page.html")

    expect(result).toBeFalsy()
  })

  it("returns false for test.js filenames", () => {
    const result = filters.jsNoTests("test script.test.js")

    expect(result).toBeFalsy()
  })
})