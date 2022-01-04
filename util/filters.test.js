const filters = require("./filters")

describe("noTests", () => {
  it("returns true for .js filenames", () => {
    const result = filters.noTests("test script.js")

    expect(result).toBeTruthy()
  })

  it("returns true for non-.js filenames", () => {
    const result = filters.noTests("test page.html")

    expect(result).toBeTruthy()
  })

  it("returns false for .test.js filenames", () => {
    const result = filters.noTests("test script.test.js")

    expect(result).toBeFalsy()
  })
})

describe("jsNoTests", () => {
  it("returns true for .js filenames", () => {
    const result = filters.jsNoTests("test script.js")

    expect(result).toBeTruthy()
  })

  it("returns false for non-.js filenames", () => {
    const result = filters.jsNoTests("test page.html")

    expect(result).toBeFalsy()
  })

  it("returns false for .test.js filenames", () => {
    const result = filters.jsNoTests("test script.test.js")

    expect(result).toBeFalsy()
  })
})

describe("noDotFiles", () => {
  it("returns true for normal filenames", () => {
    const result = filters.noDotFiles("normal name.js")

    expect(result).toBeTruthy()
  })

  it("returns false for filenames starting with a dot", () => {
    const result = filters.noDotFiles(".hidden-file")

    expect(result).toBeFalsy()
  })
})
