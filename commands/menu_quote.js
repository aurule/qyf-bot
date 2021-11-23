const { ContextMenuCommandBuilder } = require('@discordjs/builders');
const { ApplicationCommandType } = require('discord-api-types/v9');

module.exports = {
    data: new ContextMenuCommandBuilder()
        .setName('Quote Message')
        .setType(ApplicationCommandType.Message),
    async execute(interaction) {
        console.log(interaction.message);

        await interaction.reply(`quoted?`);
    },
};
