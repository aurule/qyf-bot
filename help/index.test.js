const help = require("./index")

describe("all help topics", () => {
  help.forEach((topic) => {
    describe(topic.name, () => {
      it("has an internal name", () => {
        expect(topic.name).toBeTruthy()
      })

      it("has a title", () => {
        expect(topic.title).toBeTruthy()
      })

      it("has some content", () => {
        expect(topic.help()).toBeTruthy()
      })
    })
  })
})
