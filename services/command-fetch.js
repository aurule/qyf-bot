"use strict"

const { jsNoTests } = require("../util/filters")

const fs = require("fs")
const path = require("path")
const basename = path.basename(__filename)

const guildCommandsDir = `${__dirname}/../commands`
const globalCommandsDir = `${__dirname}/../commands/global`

function getCommands(target_dir) {
  const commands = []

  fs.readdirSync(target_dir)
    .filter(jsNoTests)
    .forEach((file) => {
      const command = require(path.join(target_dir, file))
      commands.push(command)
    })

  return commands
}

module.exports = {
  getCommands,
  guild: () => getCommands(guildCommandsDir),
  global: () => getCommands(globalCommandsDir),
  all: () => {
    return [
      ...module.exports.guild(),
      ...module.exports.global(),
    ]
  }
}
