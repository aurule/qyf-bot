"use strict"

module.exports = {
  /**
   * Transforms an array of commands into an array of label/value pairs
   * suitable for the choices of a Discord string option
   * @param  {Array}        commands  The commands to transform
   * @return {Array[Array]}           Array of option choices
   */
  transform: (commands) => {
    return commands.map((command) => {
      const suffix = command.type == "menu" ? " ☰" : ""
      return {name: `${command.name}${suffix}`, value: `${command.name}`}
    })
  },
}
