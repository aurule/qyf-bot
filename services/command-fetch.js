"use strict"

const { jsNoTests, noDotFiles } = require("../util/filters")

const fs = require("fs")
const path = require("path")
const basename = path.basename(__filename)

const guildCommandsDir = `${__dirname}/../commands/guild`
const globalCommandsDir = `${__dirname}/../commands`

function getCommands(target_dir) {
  const commands = []

  fs.readdirSync(target_dir)
    .filter(jsNoTests)
    .filter(noDotFiles)
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
