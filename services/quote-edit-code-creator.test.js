const CodeCreator = require("./quote-edit-code-creator")
const { Quotes, QuoteEditCodes } = require("../models")

const { subMinutes, addMinutes, compareAsc } = require("date-fns")
const { simpleflake } = require("simpleflakes")
const { randomBytes } = require("crypto")

var editCode
var quote

describe("create", () => {
  beforeEach(async () => {
    quote = await Quotes.create()
  })

  afterEach(async () => {
    await QuoteEditCodes.destroy({ where: { quoteId: quote.id } })
    await quote.destroy()
  })

  describe("with no editCode record", () => {
    it("returns a new editCode record", async () => {
      expect(await quote.countQuoteEditCodes()).toEqual(0)

      await CodeCreator.updateOrCreate(quote)

      expect(await quote.countQuoteEditCodes()).toEqual(1)
    })

    it("sets expiration to a future date", async () => {
      const result = await CodeCreator.updateOrCreate(quote)

      expect(compareAsc(result.expiresAt, new Date())).toEqual(1)
    })
  })

  describe("with an editCode record", () => {
    describe("that is expired", () => {
      beforeEach(async () => {
        try {
          editCode = await QuoteEditCodes.create({
            quoteId: quote.id,
            shortcode: randomBytes(3).toString("hex").substring(0, 5),
            expiresAt: subMinutes(new Date(), 10),
          })
        } catch (e) {
          console.log(e)
        }
      })

      it("changes the shortcode", async () => {
        const result = await CodeCreator.updateOrCreate(quote)

        expect(result.shortcode).not.toEqual(editCode.shortcode)
      })

      it("sets expiration to a future date", async () => {
        const result = await CodeCreator.updateOrCreate(quote)

        expect(compareAsc(result.expiresAt, new Date())).toEqual(1)
      })

      it("returns the updated record", async () => {
        const result = await CodeCreator.updateOrCreate(quote)

        expect(result.id).toEqual(editCode.id)
      })
    })

    describe("that is not expired", () => {
      beforeEach(async () => {
        editCode = await QuoteEditCodes.create({
          quoteId: quote.id,
          shortcode: randomBytes(3).toString("hex").substring(0, 5),
          expiresAt: addMinutes(new Date(), 1),
        })
      })

      it("returns the existing editCode unchanged", async () => {
        const result = await CodeCreator.updateOrCreate(quote)

        expect(result).toMatchObject({
          id: editCode.id,
          shortcode: editCode.shortcode,
          expiresAt: editCode.expiresAt,
        })
      })
    })
  })
})
