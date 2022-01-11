const { SlashCommandBuilder } = require("@discordjs/builders")
const { stripIndent, oneLine } = require("common-tags")

const { Feedback, Users } = require("../models")

module.exports = {
  name: "qyf-feedback",
  data: () =>
    new SlashCommandBuilder()
      .setName("qyf-feedback")
      .setDescription(
        "Compliment the dev, suggest a new feature, or complain 'cause something broke"
      )
      .addStringOption((option) =>
        option
          .setName("type")
          .setDescription("The sort of feedback this is")
          .setRequired(true)
          .addChoice("Feature request", Feedback.TYPE_REQUEST)
          .addChoice("Bug report or complaint", Feedback.TYPE_COMPLAINT)
          .addChoice("Just saying things", Feedback.TYPE_COMMENT)
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
      defaults: {
        name: user.username,
        snowflake: user.id.toString(),
      },
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
