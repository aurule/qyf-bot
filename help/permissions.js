const { stripIndent } = require("common-tags")
const { inlineCode } = require('@discordjs/builders');

module.exports = {
  name: "permissions",
  title: "Command Permissions",
  help: () => stripIndent`
    Most of qyf-bot's commands can be used by anyone in the server who has the "Use slash commands" privilege.

    There are some commands which are restricted to guild managers and channel managers. Anyone else who tries
    to use one of these commands will see an error message. The privileged commands are:
    • ${inlineCode("/add-game")}
    • ${inlineCode("/update-game")}
    • ${inlineCode("/set-default-game")}
    • ${inlineCode("/remove-default-game")}
  `,
}
