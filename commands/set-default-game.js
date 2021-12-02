const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageActionRow, MessageSelectMenu } = require("discord.js")
const { keyv } = require("../util/keyv.js")
const { Guilds, Games } = require("../models")
const { transform } = require("../transformers/game-select-transformer")
const { explicitScope } = require("../services/default-game-scope")

module.exports = {
  data: (guild) => new SlashCommandBuilder()
    .setName("set-default-game")
    .setDescription("Set the default game for this channel")
    .addChannelOption((option) =>
      option.setName("channel").setDescription("The target channel")
    )
    .addBooleanOption((option) =>
      option
        .setName("server")
        .setDescription("Apply default to the whole server")
    ),
  async execute(interaction) {
    const current_channel = interaction.channel
    const channel_option = interaction.options.getChannel("channel")
    const target_channel = channel_option ? channel_option : current_channel
    const server_wide = interaction.options.getBoolean("server")

    const command_options = explicitScope(target_channel, server_wide)
    keyv.set(interaction.id.toString(), command_options)

    const guild = await Guilds.findByInteraction(interaction, {
      include: Games,
    })

    const gameSelectRow = new MessageActionRow().addComponents(
      new MessageSelectMenu()
        .setCustomId("defaultGameSelect")
        .setPlaceholder("Pick a game")
        .addOptions(transform(guild.Games))
    )

    return interaction.reply({
      content: `Which game do you want to set as the default for ${command_options.scope_text}?`,
      components: [gameSelectRow],
      ephemeral: true,
    })
  },
}
