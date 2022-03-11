const { Quotes, QuoteEditCodes } = require("../models")

const { addMinutes } = require("date-fns")
const { randomBytes } = require("crypto")

/**
 * Default liftime of an edit link in minutes
 * @type {Number}
 */
const DURATION = 15

/**
 * Create or update the quote edit code for a given quote
 *
 * If no edit code record exists, one is created with a random shortcode and an expiration DURATION minutes in the future.
 * If an expired code exists, its shortcode and expiry are refreshed.
 * If a non-expired code exists, it is returned as-is.
 *
 * @param  {Quotes}         quote The quote the code is for
 * @return {QuoteEditCodes}       The edit code record
 */
async function updateOrCreate(quote) {
  const [editCode, _isNew] = await QuoteEditCodes.findOrCreate({
    where: { quoteId: quote.id },
    defaults: {
      shortcode: randomBytes(3).toString("hex").substring(0, 5),
      expiresAt: addMinutes(new Date(), DURATION),
    },
  })

  if (editCode.expiresAt <= new Date()) {
    await editCode.update({
      shortcode: randomBytes(3).toString("hex").substring(0, 5),
      expiresAt: addMinutes(new Date(), DURATION),
    })
  }

  return editCode
}

module.exports = {
  updateOrCreate,
}
