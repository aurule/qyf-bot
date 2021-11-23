const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('add-game')
        .setDescription('Add a game to this server')
        .addStringOption(option =>
            option.setName('name')
            .setDescription('The name of the game')
            .setRequired(true)),
    async execute(interaction) {
        const game_name = interaction.options.getString('name');

        await interaction.reply(`Added game "${game_name}"`);
    },
};
