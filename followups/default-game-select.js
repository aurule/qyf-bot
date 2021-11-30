const { keyv } = require("../util/keyv.js");
const { DefaultGames, Games } = require("../models");
const { logger } = require('../util/logger')

module.exports = {
  name: "defaultGameSelect",
  async execute(interaction) {
    options = await keyv.get(interaction.message.interaction.id);

    const game_id = interaction.values[0];
    try {
      await DefaultGames.upsert({
        name: options.name,
        type: options.target_type,
        snowflake: options.target_snowflake,
        gameId: game_id,
      })
    } catch(error) {
      logger.debug(error);
      return interaction.update({ content: "Something went wrong :-(", components: [] });
    }

    const game = await Games.findOne({where: {id: game_id}});
    interaction.update({ content: `Picked ${game.name}!`, components: [] });
    return interaction.followUp(`${game.name} is now the default for ${options.name}.`);
  },
};
