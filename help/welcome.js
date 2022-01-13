const { inlineCode } = require("@discordjs/builders")
const { oneLine } = require("common-tags")

module.exports = {
  name: "welcome",
  title: "Welcome to qyf-bot",
  description: "A friendly introduction",
  help() {
    return [
      oneLine`
        Welcome and thanks for installing qyf-bot! This Discord bot lets you quote fun things your friends say
        and ~~hold it over their heads~~ relive the memories later. It operates mainly through slash commands,
        which are invoked by starting your message with a ${inlineCode("/")} character. You can use the
        ${inlineCode("/qyf-help")} command if you run into trouble. Try starting with the
        ${inlineCode("Available Commands")} help topic to see how commands work and what qyf-bot can do.
      `,
      "",
      oneLine`
        qyf-bot organizes quotes by game, because things often only make sense with the right context. Use the
        ${inlineCode("/add-game")} command to create a new game, and ${inlineCode("/set-default-game")} to
        make it the default for a channel, group, or server. Then, use ${inlineCode("/quote")} to start recording
        quotes!
      `,
      "",
      oneLine`
        If you're handling multiple games in your server, take a look at the ${inlineCode("Default Games")} help
        topic. The default games system is pretty flexible! Also, some commands can only be used by users with
        certain roles on the server. See the ${inlineCode("Command Permissions")} help topic for more about that.
      `,
      "",
      "Thanks again, and happy quoting!",
    ].join("\n")
  },
}
