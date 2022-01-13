const { inlineCode } = require("@discordjs/builders")
const { stripIndent, oneLine } = require("common-tags")

module.exports = {
  name: "default-games",
  title: "Default Games",
  description: "Explanation of how default games work",
  help() {
    return [
      oneLine`
        qyf-bot allows you to set the default game for a channel, a category, or a server. Once set, certain
        commands will use this game by default instead of prompting you. For example, using \`/quote\` in a
        channel which has a default game will automatically add the new quote to that game.
      `,
      "",
      oneLine`
        You can set a default game using the \`/set-default-game\` command, and remove the default game
        using \`/remove-default-game\`. These commands do not create or delete games, they just change whether
        a game is the default for a channel (or other scope).
      `,
      "",
      oneLine`
        When determining the default game to use, commands first check if there's one for the current channel.
        If so, they use it. If not, they check if there's one for the channel's category and use it. If there
        isn't one of those either, they check if there's a default game for the server. This setup means that
        you can set a default game for the server, then override it for specific channels or categories (groups of
        channels).
      `,
    ].join("\n")
  },
}
