const { keyv } = require('../util/keyv.js');

module.exports = {
    name: 'appendQuoteSelect',
    async execute(interaction) {
        options = await keyv.get(interaction.message.interaction.id);

        await interaction.update({ content: 'Chose one!', components: [] })
    }
}
