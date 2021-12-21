const { ContextMenuCommandBuilder } = require("@discordjs/builders")
const { ApplicationCommandType } = require("discord-api-types/v9")
const { MessageActionRow, MessageSelectMenu } = require("discord.js")

const { determineName } = require("../services/speaker-name")
const { addLine } = require("../services/quote-builder")
const QuoteSnippetTransformer = require("../transformers/quote-snippet-transformer")
const QuoteFinder = require("../services/quote-finder")

module.exports = {
  name: "Add to quote",
  data: (guild) => new ContextMenuCommandBuilder()
    .setName("Add to quote")
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    const message = await interaction.channel.messages.fetch(
      interaction.targetId
    )

    const text = message.content
    const speaker = message.author
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
    const speaker_member = await interaction.guild.members.fetch(speaker)
    const speaker_name = determineName({
      nickname: speaker_member.nickname,
      username: speaker.username,
      alias: null,
    })

    // add the new line
    return addLine({
      text: text,
      attribution: speaker_name,
      speaker: speaker,
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
}
