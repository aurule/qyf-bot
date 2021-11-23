module.exports = {
    name: 'defaultGameSelect',
    async execute(interaction) {
        await interaction.update({ content: 'Chose one!', components: [] })
    }
}
