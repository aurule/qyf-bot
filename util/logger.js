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
  if (process.env.NODE_ENV == "production") {
    const papertrail = require("pino-papertrail")
    return papertrail.createWriteStream(
      {
        host: "logs5.papertrailapp.com",
        port: 15191,
        echo: false,
      },
      "qyf-bot")
    // NOTE: Leaving the file config here for ease of reference
    // return Pino.transport({
    //   target: "pino/file",
    //   options: {
    //     destination: "/home/qyf/qyf-bot/logs/qyf-bot.log",
    //     mkdir: true,
    //   }
    // })
  }
}

const default_levels = {
  "development": "info",
  "test": "error",
  "ci": "error",
  "production": "warn"
}

module.exports = {
  logger: Pino({level: default_levels[process.env.NODE_ENV]}, logStream),
}
