const Pino = require("pino")

require("dotenv").config()

const logStream = pickStream()

function pickStream() {
  if (process.env.NODE_ENV == "development") {
    const pretty = require('pino-pretty')
    return pretty()
  }
  if (process.env.NODE_ENV == "test") {
    const devnull = require('dev-null')
    return devnull()
  }
  if (process.env.NODE_ENV == "ci") {
    const devnull = require('dev-null')
    return devnull()
  }
const default_levels = {
  "development": "info",
  "test": "error",
  "ci": "error",
  "production": "warning"
}

module.exports = {
  logger: Pino({level: default_levels[process.env.NODE_ENV]}, logStream),
}
