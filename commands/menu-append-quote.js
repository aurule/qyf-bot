const { ContextMenuCommandBuilder } = require("@discordjs/builders")
const { ApplicationCommandType } = require("discord-api-types/v9")
const { MessageActionRow, MessageSelectMenu } = require("discord.js")
const { stripIndent, oneLine } = require("common-tags")

const { determineName } = require("../services/speaker-name")
const { addLine } = require("../services/quote-builder")
const QuotePresenter = require("../presenters/quote-presenter")
const QuoteFinder = require("../services/quote-finder")
const { quoteReply } = require("../services/reply-builder")

module.exports = {
  name: "Add to quote",
  type: "menu",
  data: () =>
    new ContextMenuCommandBuilder()
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
        content: oneLine`
          You haven't recorded a recent enough quote to add a line! You can only
          add to a quote if you're the one who recorded it, and you did so in
          the last 15 minutes.
        `,
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
          quoteReply({
            reporter: user,
            speaker: speaker,
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
        ${command_name} is a context menu command that adds a Discord message to the quote you most recently
        created. Discord only makes these kinds of commands available to desktop users. To use
        ${command_name}, right click on a message, then hover over *Apps*, then click ${command_name} in the
        small menu that appears. In order to add a line, your most recent quote has to be newer than 15
        minutes. If you haven't made a quote recently enough, ${command_name} will let you know.
      `,
      "",
      oneLine`
        The message's contents will be added as a new line on your last quote. The user who sent the message
        will be set as the line's speaker and their server nickname (if set) or Discord username will be used
        as the line's attribution. ${command_name} will then display the full quote with all of its lines.
      `,
    ].join("\n")
  },
}
