const { SlashCommandBuilder } = require("@discordjs/builders")
const { stripIndent } = require("common-tags")

const commandFetch = require("../services/command-fetch")
const CommandChoicesTransformer = require("../transformers/command-choices-transformer")
const CommandHelpPresenter = require("../presenters/command-help-presenter")
const Topics = require("../help")

module.exports = {
  name: "qyf-help",
  data() {
    return new SlashCommandBuilder()
      .setName("qyf-help")
      .setDescription("Get help with qyf-bot and its commands")
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
    return stripIndent`
      ${command_name} shows helpful information about a command or topic.

      Args:
          \`topic\`: The topic you want help with
          \`command\`: The command you want help with

      Both args let you pick from a list, so you don't need to memorize command or topic names.

      If you give both a command and a topic, ${command_name} will only show help for the topic.
    `
  },
}
