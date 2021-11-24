const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');
const { keyv } = require('../util/keyv.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-default-game')
        .setDescription('Set the default game for this channel')
        .addChannelOption(option =>
            option.setName('channel')
            .setDescription('The target channel'))
        .addBooleanOption(option =>
            option.setName('server')
            .setDescription('Apply default to the whole server')),
    async execute(interaction) {
        const current_channel = interaction.channel;
        const channel_option = interaction.options.getChannel('channel');
        const target_channel = channel_option ? channel_option : current_channel;
        const server_wide = interaction.options.getBoolean('server');

        const command_options = {
            target_channel: target_channel,
            server_wide: server_wide
        }
        keyv.set(interaction.id, command_options);

        const scope = server_wide ? 'the server' : target_channel;
        const gameSelectRow = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('defaultGameSelect')
                    .setPlaceholder('Pick a game')
                    .addOptions([
                        {
                            label: 'First game',
                            description: 'The first of the games',
                            value: '1',
                        },
                        {
                            label: 'Second game',
                            description: 'The second mighty game',
                            value: '2',
                        },
                    ]),
            );

        await interaction.reply({
            content: `Which game do you want to set as the default for ${scope}?`,
            components: [gameSelectRow],
            ephemeral: true
        });
    },
};
