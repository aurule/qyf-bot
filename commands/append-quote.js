const { SlashCommandBuilder } = require("@discordjs/builders")

const { Quotes } = require("../models")
const { determineName } = require("../services/speaker-name")
const QuoteBuilder = require("../services/quote-builder")
const QuoteSnippetTransformer = require("../transformers/quote-snippet-transformer")

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
    const quote = Quotes.findLastEditable(user)

    if (!quote) {
      return interaction.reply({
        content:
          "You haven't recorded a recent enough quote to add a line! You can only add to a quote if you're the one who recorded it, and you did so in the last 15 minutes.",
        ephemeral: true,
      })
    }

    // determine the attribution
    const speaker =
      speaker_arg || interaction.guild.members.fetch(quote.speaker.snowflake)
    const speaker_name = determineName({
      nickname: interaction.guild.members.fetch(speaker).nickname,
      username: speaker.username,
      alias: alias,
    })

    // add the new line
    const result = QuoteBuilder.addLine({
      text: text,
      attribution: speaker_name,
      speaker: speaker,
      quote,
    })
    if (result instanceof Quotes) {
      await interaction.reply(`${user.username} added text from ${speaker_name}: ${text}`)
      return interaction.followUp(`The full quote is:\n${QuoteSnippetTransformer.transform(quote)}`)
    } else {
      return interaction.reply("Something went wrong :-(")
    }
  },
}
