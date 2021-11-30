const { SlashCommandBuilder } = require("@discordjs/builders")
const { MessageActionRow, MessageSelectMenu } = require("discord.js")
const { keyv } = require("../util/keyv.js")
const { Guilds, Games, DefaultGames } = require("../models")
const { transform } = require("../transformers/gameSelectTransformer")

module.exports = {
  data: new SlashCommandBuilder()
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

    const command_options = this.followupOptions(target_channel, server_wide)
    keyv.set(interaction.id, command_options)

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
  followupOptions(target_channel, server_wide) {
    if (server_wide) {
      return {
        name: target_channel.guild.name,
        scope_text: "the server",
        target_type: DefaultGames.TYPE_GUILD,
        target_snowflake: target_channel.guild.id.toString(),
      }
    }
    return {
      name: target_channel.name,
      scope_text: target_channel.name,
      target_type: DefaultGames.TYPE_CHANNEL,
      target_snowflake: target_channel.id.toString(),
    }
  },
}
