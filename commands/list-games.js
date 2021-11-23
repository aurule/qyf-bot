const { SlashCommandBuilder } = require('@discordjs/builders');
const { channelMention } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('list-games')
        .setDescription('Add a game to this server')
        .addStringOption(option =>
            option.setName('sort')
            .setDescription('How to sort the games')
            .addChoice('By name', 'name')
            .addChoice('By total quotes', 'num_quotes')
            .addChoice("By where it's default", 'default_channel')),
    async execute(interaction) {
        const sort = interaction.options.getString('sort');

        const reply_text = `* First Game (server default)
* **Game the Second** (${channelMention('912398399993679925')})`;
        await interaction.reply(reply_text);
    },
};
