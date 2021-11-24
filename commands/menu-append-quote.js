const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { ApplicationCommandType } = require('discord-api-types/v9');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Add to quote')
        .setType(ApplicationCommandType.Message),
    async execute(interaction) {
        const message = await interaction.channel.messages.fetch(interaction.targetId)

        const text = message.content;
        const speaker = message.author;
        const command_options = {
            text: text,
            speaker: speaker,
            alias: null,
        }
        keyv.set(interaction.id, command_options);

        const quoteSelectRow = new MessageActionRow()
            .addComponents(
                new MessageSelectMenu()
                    .setCustomId('appendSelectQuote')
                    .setPlaceholder('Pick a quote')
                    .addOptions([
                        {
                            label: 'First quote',
                            description: 'The first of the quotes',
                            value: '1',
                        },
                        {
                            label: 'Second quote',
                            description: 'The second mighty quote',
                            value: '2',
                        },
                    ]),
            );

        await interaction.reply({ content: 'Which quote do you want to add to? Only the most recent few quotes can be changed.', components: [quoteSelectRow], ephemeral: true });
    },
};
