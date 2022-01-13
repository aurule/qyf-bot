"use strict"

const replyBuilder = require("./reply-builder")

const { simpleflake } = require("simpleflakes")

describe("quoteReply", () => {
  it("includes the reporter id", () => {
    const speaker = { id: simpleflake() }
    const reporter = { id: simpleflake() }

    const reply = replyBuilder.quoteReply({
      speaker: speaker,
      reporter: reporter,
      text: "test text",
    })

    expect(reply).toMatch(reporter.id.toString())
  })

  it("includes the quote text", () => {
    const speaker = { id: simpleflake() }
    const reporter = { id: simpleflake() }

    const reply = replyBuilder.quoteReply({
      speaker: speaker,
      reporter: reporter,
      text: "test text",
    })

    expect(reply).toMatch("test text")
  })

  describe("with a normal speaker", () => {
    it("includes the speaker id", () => {
      const speaker = { id: simpleflake() }
      const reporter = { id: simpleflake() }

      const reply = replyBuilder.quoteReply({
        speaker: speaker,
        reporter: reporter,
        text: "test text",
      })

      expect(reply).toMatch(speaker.id.toString())
    })

    it("includes the alias if given", () => {
      const speaker = { id: simpleflake() }
      const reporter = { id: simpleflake() }

      const reply = replyBuilder.quoteReply({
        speaker: speaker,
        reporter: reporter,
        alias: "a person",
        text: "test text",
      })

      expect(reply).toMatch("as a person")
    })

    it("omits the alias reference if not given", () => {
      const speaker = { id: simpleflake() }
      const reporter = { id: simpleflake() }

      const reply = replyBuilder.quoteReply({
        speaker: speaker,
        reporter: reporter,
        text: "test text",
      })

      expect(reply).not.toMatch(" as ")
    })
  })

  describe("actions", () => {
    it("uses the quoted action by default", () => {
      const speaker = { id: simpleflake() }
      const reporter = { id: simpleflake() }

      const reply = replyBuilder.quoteReply({
        speaker: speaker,
        reporter: reporter,
        text: "test text",
      })

      expect(reply).toMatch("quoted")
    })

    it("uses custom action if given", () => {
      const speaker = { id: simpleflake() }
      const reporter = { id: simpleflake() }

      const reply = replyBuilder.quoteReply({
        speaker: speaker,
        reporter: reporter,
        text: "test text",
        action: "added text from"
      })

      expect(reply).toMatch("added text from")
    })
  })
})
