const { SlashCommandBuilder, userMention } = require("@discordjs/builders")

const { Lines } = require("../models")
const { determineName } = require("../services/speaker-name")
const { addLine } = require("../services/quote-builder")
const QuotePresenter = require("../presenters/quote-presenter")
const QuoteFinder = require("../services/quote-finder")
const { stripIndent, oneLine } = require("common-tags")
const { quoteReply } = require("../services/reply-builder")
const { memberOrAnonymous } = require("../services/member-injector")

/**
 * Get the correct member object
 * @param  {User|Member}  arg         Discord user or member object from the options
 * @param  {Interaction}  interaction Discord interaction object for looking up members
 * @param  {Lines}        last_line   Line object for determining the last used speaker
 * @return {Member}                   Discord member object to user for the line attribution
 */
async function getSpeakerMember(arg, interaction, last_line) {
  if (arg) return memberOrAnonymous(interaction.guild, arg)

  return memberOrAnonymous(interaction.guild, {id: last_line.speaker.snowflake})
}

module.exports = {
  name: "append-quote",
  description: "Add a line to your last quote",
  data: () =>
    new SlashCommandBuilder()
      .setName(module.exports.name)
      .setDescription(module.exports.description)
      .addStringOption((option) =>
        option.setName("text").setDescription("What was said").setRequired(true)
      )
      .addUserOption((option) =>
        option
          .setName("speaker")
          .setDescription(
            "The user who said the thing. Defaults to last speaker."
          )
      )
      .addStringOption((option) =>
        option
          .setName("alias")
          .setDescription(
            "The name of who said it. Replaces the speaker's current nickname."
          )
      )
      .setDMPermission(true),
  getSpeakerMember,
  async execute(interaction) {
    const text = interaction.options.getString("text")
    const speaker_arg = interaction.options.getUser("speaker")
    const alias = interaction.options.getString("alias")
    const user = interaction.user

    // get the quote
    const quote = await QuoteFinder.findLastEditable(user)

    if (!quote) {
      return interaction.reply({
        content: oneLine`
          You haven't recorded a recent enough quote to add a line! You can only
          add to a quote if you're the one who recorded it, and you did so in
          the last 15 minutes.
        `,
        ephemeral: true,
      })
    }

    // determine the attribution
    const last_line = await Lines.findOne({
      where: { quoteId: quote.id },
      order: [["lineOrder", "DESC"]],
      include: 'speaker',
    })

    const speaker_member = await getSpeakerMember(speaker_arg, interaction, last_line)
    const speaker_name = determineName({
      nickname: speaker_member.nickname,
      username: speaker_member.user.username,
      alias: alias,
    })

    // add the new line
    return addLine({
      text: text,
      attribution: speaker_name,
      speaker: speaker_member.user,
      quote,
    })
      .then(async (result) => {
        await interaction.reply(
          quoteReply({
            reporter: user,
            speaker: speaker_member.user,
            alias: alias,
            text: text,
            action: "added text from"
          })
        )
        return interaction.followUp(
          `The full quote is:\n${QuotePresenter.present(quote)}`
        )
      })
      .catch((error) => {
        throw(error)
      })
  },
  help({ command_name }) {
    return [
      oneLine`
        ${command_name} adds another line to the quote you most recently created. However, there is a time
        limit: quotes have to be newer than 15 minutes. If you haven't made a quote recently enough,
        ${command_name} will let you know.
      `,
      "",
      stripIndent`
        Args:
            \`text\`: (required) The text of the new line
            \`speaker\`: The user who said it. Defaults to the same user as the previous line.
            \`alias\`: The name to use for the speaker, in case their nickname doesn't match their character, etc.
      `,
      "",
      oneLine`
        The given \`text\` will be added as a new line on your last quote. Unless you specify a different
        \`speaker\` or \`alias\`, it will use the same attribution as that previous line, under the assumption
        that it was said by the same user speaking as the same character. ${command_name} will then display
        the full quote with all of its lines.
      `,
      "",
      oneLine`
        If you give a new \`speaker\`, the new line will use their current server nickname (if set) or their
        Discord username as the attribution. If you give an \`alias\`, the new line will use it for the
        attribution with no exceptions. To record a line from someone who isn't on Discord, or from an
        anonymous source, use the ${userMention(process.env.CLIENT_ID)} user as the speaker.
      `,
    ].join("\n")
  },
}
