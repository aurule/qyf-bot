const Pino = require("pino")
const pretty = require('pino-pretty')
require("dotenv").config()

const options = {}
const stream = pickStream()

function pickStream() {
  if (process.env.NODE_ENV != "production") {
    return pretty()
  }
}

module.exports = {
  logger: Pino(stream),
}
