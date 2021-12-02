const { ContextMenuCommandBuilder } = require("@discordjs/builders")
const { ApplicationCommandType } = require("discord-api-types/v9")

module.exports = {
  data: (guild) => new ContextMenuCommandBuilder()
    .setName("Quote Message")
    .setType(ApplicationCommandType.Message),
  async execute(interaction) {
    const message = await interaction.channel.messages.fetch(
      interaction.targetId
    )
    const text = message.content
    const speaker = message.author
    const name = speaker.username

    await interaction.reply(`The quote: "${text}" ~ ${name}`)
  },
}
