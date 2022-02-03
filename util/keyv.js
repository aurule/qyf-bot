const Keyv = require("keyv")
const { logger } = require("./logger")

const redis_url = process.env.REDIS_URL

const followup_store = redis_url
    ? new Keyv(redis_url, { namespace: "followups", ttl: 900000 })
    : new Keyv({ namespace: "followups", ttl: 900000 })
const cache = redis_url
    ? new Keyv(redis_url, { namespace: "cache" })
    : new Keyv({ namespace: "cache" })

followup_store.on("error", (err) => logger.error("Connection Error", err))
cache.on("error", (err) => logger.error("Connection Error", err))

module.exports = {
    followup_store,
    cache,
}
