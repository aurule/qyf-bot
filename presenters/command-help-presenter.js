const { inlineCode, italic, userMention } = require('@discordjs/builders');
const CommandNamePresenter = require("./command-name-presenter")

module.exports = {
  /**
   * Return a formatted message string of the command's name and help text
   *
   * @param  {Command} command  The command object to present
   * @return {String}           Markdown-formatted string of the command's name and help text
   */
  present: (command) => {
    const lines = []

    const command_name = CommandNamePresenter.present(command)

    lines.push(`Showing help for ${command_name}:`)

    lines.push(command.help({command_name: command_name}))

    if (command.dm) {
      lines.push("")
      lines.push(`${command_name} can be used in DMs with ${userMention(process.env.CLIENT_ID)}`)
    }

    return lines.join("\n")
  }
}
