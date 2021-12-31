const Pino = require("pino")

require("dotenv").config()

const options = {}
const logStream = pickStream()

function pickStream() {
  if (process.env.NODE_ENV == "development") {
    const pretty = require('pino-pretty')
    return pretty()
  }
  if (process.env.NODE_ENV == "test") return devnull()
  if (process.env.NODE_ENV == "ci") {
    const devnull = require('dev-null')
    return devnull()
  }
}

module.exports = {
  logger: Pino(logStream),
}
