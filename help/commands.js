const { inlineCode } = require("@discordjs/builders")
const { stripIndent, oneLine } = require("common-tags")
const commandFetch = require("../services/command-fetch")

module.exports = {
  name: "commands",
  title: "Commands",
  description: "How to use slash commands and what's available",
  help() {
    return [
      oneLine`
        qyf-bot uses slash commands that let you add games and quotes. Slash commands are started by typing a
        ${inlineCode("/")} character and then the name of the command. Discord will suggest commands as you
        type. To accept a suggestion, click it from the list that pops up or hit the ${inlineCode("Tab")} key.
      `,
      "",
      oneLine`
        Commands usually accept one or more arguments. These are used to pass information to the command, like
        the text of a quote you want to record. Once you've selected a command, Discord will let you fill in
        its required arguments. When you're done with an argument, press ${inlineCode("Tab")} to move to the
        next one. After the required arguments have been filled out, Discord will show you the command's
        optional arguments in a list, like it did for the command names. Hit ${inlineCode("Tab")} or select
        the argument name to begin filling it in.
      `,
      "",
      "Here are all of the commands that qyf-bot knows:",
      commandFetch
        .all()
        .map(c => `• ${inlineCode("/"+c.name)} - ${c.description}`)
        .join("\n"),
    ].join("\n")
  },
}
