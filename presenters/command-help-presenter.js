const { inlineCode, italic } = require('@discordjs/builders');

module.exports = {
  /**
   * Return a formatted message string of the command's name and help text
   *
   * @param  {Command} command  The command object to present
   * @return {String}           Markdown-formatted string of the command's name and help text
   */
  present: (command) => {
    const lines = []

    const command_name = command.type == "menu" ? italic(command.name) : inlineCode(`/${command.name}`)
    lines.push(`Showing help for ${command_name}:`)

    lines.push(command.help({command_name: command_name}))

    return lines.join("\n")
  }
}
