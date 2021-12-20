const { SlashCommandBuilder } = require("@discordjs/builders")

const { sequelize, Quotes, Lines, Users } = require("../models")
const { determineName } = require("../services/speaker-name")
const { addLine } = require("../services/quote-builder")
const QuoteSnippetTransformer = require("../transformers/quote-snippet-transformer")
const QuoteFinder = require("../services/quote-finder")

/**
 * Get the correct member object
 * @param  {User|Member}  arg         Discord user or member object from the options
 * @param  {Interaction}  interaction Discord interaction object for looking up members
 * @param  {Lines}        last_line   Line object for determining the last used speaker
 * @return {Member}                   Discord member object to user for the line attribution
 */
async function getSpeakerMember(arg, interaction, last_line) {
  if (arg) return interaction.guild.members.fetch(arg)

  return interaction.guild.members.fetch(last_line.speaker.snowflake)
}

module.exports = {
  name: "append-quote",
  data: (guild) =>
    new SlashCommandBuilder()
      .setName("append-quote")
      .setDescription("Add a line to a quote")
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
      ),
  async execute(interaction) {
    const text = interaction.options.getString("text")
    const speaker_arg = interaction.options.getUser("speaker")
    const alias = interaction.options.getString("alias")
    const user = interaction.user

    // get the quote
    const quote = await QuoteFinder.findLastEditable(user)

    if (!quote) {
      return interaction.reply({
        content:
          "You haven't recorded a recent enough quote to add a line! You can only add to a quote if you're the one who recorded it, and you did so in the last 15 minutes.",
        ephemeral: true,
      })
    }

    // determine the attribution
    const last_line = await Lines.findOne({
      where: { quoteId: quote.id },
      order: [["lineOrder", "DESC"]],
      include: 'speaker',
    })

    const speaker = await getSpeakerMember(speaker_arg, interaction, last_line)
    const speaker_name = determineName({
      nickname: speaker.nickname,
      username: speaker.user.username,
      alias: alias,
    })

    // add the new line
    return addLine({
      text: text,
      attribution: speaker_name,
      speaker: speaker.user,
      quote,
    })
      .then(async (result) => {
        await interaction.reply(
          `${user.username} added text from ${speaker_name}: ${text}`
        )
        return interaction.followUp(
          `The full quote is:\n${QuoteSnippetTransformer.transform(quote)}`
        )
      })
      .catch((error) => {
        return interaction.reply("Something went wrong :-(")
      })
  },
  getSpeakerMember,
}
