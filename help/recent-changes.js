const { hideLinkEmbed } = require("@discordjs/builders")
const { stripIndent, oneLine } = require("common-tags")
const fs = require("fs")
const path = require("path")

const { version } = require("../package.json")

function getChangelog() {
  try {
    return fs.readFileSync(path.join(__dirname, "../changelog", `${version}.md`))
  } catch(error) {
    return `no changelog for ${version}`
  }
}

module.exports = {
  name: "changes",
  title: "Recent Changes",
  description: "See what's new!",
  help() {
    return [
      `qyf-bot is on version ${version}. Here's what's new!`,
      "",
      getChangelog(),
      `Older change logs can be found on github: ${hideLinkEmbed("https://github.com/aurule/qyf-bot/tree/main/changelog")}`,
    ].join("\n")
  },
}
