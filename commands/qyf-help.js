const { SlashCommandBuilder, italic, underscore } = require("@discordjs/builders")
const { stripIndent, oneLine } = require("common-tags")

const commandFetch = require("../services/command-fetch")
const CommandChoicesTransformer = require("../transformers/command-choices-transformer")
const CommandHelpPresenter = require("../presenters/command-help-presenter")
const Topics = require("../help")

module.exports = {
  name: "qyf-help",
  description: "Get help with qyf-bot and its commands",
  data() {
    return new SlashCommandBuilder()
      .setName(module.exports.name)
      .setDescription(module.exports.description)
      .addStringOption((option) =>
        option
          .setName("topic")
          .setDescription("The topic you want help with")
          .addChoices(Topics.map((t) => [`${t.title}`, `${t.name}`]))
      )
      .addStringOption((option) =>
        option
          .setName("command")
          .setDescription("The command you want help with")
          .addChoices(CommandChoicesTransformer.transform(commandFetch.all()))
      )
  },
  async execute(interaction) {
    const command_name_arg = interaction.options.getString("command")
    const topic_name = interaction.options.getString("topic")

    if (topic_name) {
      const topic = Topics.get(topic_name)
      if (!topic)
        return interaction.reply(
          `No help is available for the topic "${topic_name}"`
        )

      return interaction.reply(topic.help())
    }

    const command_name = command_name_arg || module.exports.name
    const command = interaction.client.commands.get(command_name)

    if (!command?.help)
      return interaction.reply(
        `No help is available for the command "${command_name}"`
      )

    // return reply with the command's help text
    return interaction.reply(CommandHelpPresenter.present(command))
  },
  async dm(interaction) {
    return module.exports.execute(interaction)
  },
  help({ command_name }) {
    return [
      `${command_name} shows helpful information about a command or topic.`,
      "",
      stripIndent`
        Args:
            \`topic\`: The topic you want help with
            \`command\`: The command you want help with
      `,
      "",
      oneLine`
        Both args let you pick from a list, so you don't need to memorize command or topic names. If you give
        both a command and a topic, ${command_name} will only show help for the topic.
      `,
      "",
      oneLine`
        If you haven't used qyf-bot before, start with the ${underscore(Topics.get("welcome").title)} help
        topic, then take a look at the ${underscore(Topics.get("commands").title)} topic to learn about commands.
      `,
      "",
      "Here are the available help topics:",
      Topics
        .map(t => `• ${t.title} - ${italic(t.description)}`)
        .join("\n")
    ].join("\n")
  },
}
