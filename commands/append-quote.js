const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageActionRow, MessageSelectMenu } = require("discord.js")
const { keyv } = require("../util/keyv.js")

module.exports = {
  data: (guild) => new SlashCommandBuilder()
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
    const speaker = interaction.options.getUser("speaker")
    const alias = interaction.options.getString("alias")
    const command_options = {
      text: text,
      speaker: speaker,
      alias: alias,
    }
    keyv.set(interaction.id, command_options)

    const quoteSelectRow = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("appendQuoteSelect")
        .setPlaceholder("Pick a quote")
        .addOptions([
          {
            label: "First quote",
            description: "The first of the quotes",
            value: "1",
          },
          {
            label: "Second quote",
            description: "The second mighty quote",
            value: "2",
          },
        ])
    )

    await interaction.reply({
      content:
        "Which quote do you want to add to? Only the most recent few quotes can be changed.",
      components: [quoteSelectRow],
      ephemeral: true,
    })
  },
}
