const { inlineCode } = require("@discordjs/builders")
const { stripIndent, oneLine } = require("common-tags")
const commandFetch = require("../services/command-fetch")
const ManagerPolicy = require("../policies/manager-policy")

module.exports = {
  name: "permissions",
  title: "Command Permissions",
  help() {
    return [
      "Most of qyf-bot's commands can be used by anyone in the server who has the *Use Application Commands* permission.",
      "",
      oneLine`
        There are some commands which are restricted to users with the *Manage Channels* or *Manage Server*
        permissions. Anyone else who tries to use one of these commands will see an error message. The
        privileged commands are:
      `,
      commandFetch
        .all()
        .filter(c => c.policy == ManagerPolicy)
        .map(c => `• ${inlineCode("/"+c.name)}`)
        .join("\n"),
    ].join("\n")
  },
}
