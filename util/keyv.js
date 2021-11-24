const Keyv = require("keyv");
const logger = require("pino")();

const redis_url = process.env.REDIS_URL;

const keyv = redis_url ? new Keyv(redis_url) : new Keyv();

keyv.on("error", (err) => logger.error("Connection Error", err));

exports.keyv = keyv;
