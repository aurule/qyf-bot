const Pino = require("pino")
const pretty = require('pino-pretty')
const devnull = require('dev-null')

require("dotenv").config()

const options = {}
const logStream = pickStream()

function pickStream() {
  if (process.env.NODE_ENV == "development") return pretty()
  if (process.env.NODE_ENV == "test") return devnull()
  if (process.env.NODE_ENV == "ci") return devnull()
}

module.exports = {
  logger: Pino(logStream),
}
