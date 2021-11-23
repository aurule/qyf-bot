module.exports = {
    name: 'appendSelectQuote',
    async execute(interaction) {
        await interaction.update({ content: 'Chose one!', components: [] })
    }
}
