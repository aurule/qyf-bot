const { inlineCode, italic } = require('@discordjs/builders');

module.exports = {
  /**
   * Return a formatted version of the command's name
   *
   * @param  {Command} command  The command object to present
   * @return {String}           Markdown-formatted string of the command's name
   */
  present: (command) => {
    return command.type == "menu" ? italic(command.name) : inlineCode(`/${command.name}`)
  }
}
