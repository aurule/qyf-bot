const { SlashCommandBuilder } = require("@discordjs/builders");
const { MessageActionRow, MessageSelectMenu } = require("discord.js");
const { keyv } = require("../util/keyv.js");
const { Guilds } = require("../models");
const { transform } = require("../transformers/gameSelectTransformer");

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
        const current_channel = interaction.channel;
        const channel_option = interaction.options.getChannel("channel");
        const target_channel = channel_option
            ? channel_option
            : current_channel;
        const server_wide = interaction.options.getBoolean("server");
        const scope_text = server_wide ? "the server" : target_channel;

        const command_options = {
            target_channel: target_channel,
            server_wide: server_wide,
            scope_text: scope_text,
        };
        keyv.set(interaction.id, command_options);

        const guild = await Guilds.findByInteraction(interaction);
        const games = await guild.getGames();

        const gameSelectRow = new MessageActionRow().addComponents(
            new MessageSelectMenu()
                .setCustomId("defaultGameSelect")
                .setPlaceholder("Pick a game")
                .addOptions(transform(games))
        );

        await interaction.reply({
            content: `Which game do you want to set as the default for ${scope_text}?`,
            components: [gameSelectRow],
            ephemeral: true,
        });
    },
};
