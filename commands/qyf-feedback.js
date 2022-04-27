const { SlashCommandBuilder } = require("@discordjs/builders")
const { stripIndent, oneLine } = require("common-tags")

const { Feedback, Users } = require("../models")
const BannedPolicy = require("../policies/banned-policy")

module.exports = {
  name: "qyf-feedback",
  description: "Compliment the dev, suggest a new feature, or complain 'cause something broke",
  policy: BannedPolicy,
  data: () =>
    new SlashCommandBuilder()
      .setName(module.exports.name)
      .setDescription(module.exports.description)
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("The sort of feedback this is")
          .setRequired(true)
          .setChoices(
            {name: "Feature request", value: Feedback.TYPE_REQUEST},
            {name: "Bug report or complaint", value: Feedback.TYPE_COMPLAINT},
            {name: "Just saying things", value: Feedback.TYPE_COMMENT}
          )
      )
      .addStringOption((option) =>
        option
          .setName("content")
          .setDescription("Your message to the dev")
          .setRequired(true)
      ),
  async execute(interaction) {
    const type = interaction.options.getString("type")
    const content = interaction.options.getString("content")
    const user = interaction.user

    const [feedback_user, _isNewQuoter] = await Users.findOrCreate({
      where: { snowflake: user.id.toString() },
      defaults: { name: user.username },
    })

    await Feedback.create({
      type: type,
      content: content,
      reporterId: feedback_user.id,
    })

    return interaction.reply({
      content: "Feedback sent!",
      ephemeral: true,
    })
  },
  async dm(interaction) {
    return module.exports.execute(interaction)
  },
  help({ command_name }) {
    return [
      oneLine`
        ${command_name} saves a comment, request, or complaint about qyf-bot.
      `,
      "",
      stripIndent`
        Args:
            \`type\`: (required) The kind of feedback (request, complaint, or comment)
            \`content\`: (required) The text of your feedback
      `,
      "",
      oneLine`
        The messages sent via ${command_name} are saved outside of Discord so that the dev can work on them in
        her own time. Each one you submit is linked to your username, so that she can contact you for
        clarification or more details if necessary.
      `,
    ].join("\n")
  },
}
