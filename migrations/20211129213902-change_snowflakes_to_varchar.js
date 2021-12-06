'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    await queryInterface.changeColumn('DefaultGames', 'snowflake', {
      type: Sequelize.STRING,
    })
    await queryInterface.changeColumn('Guilds', 'snowflake', {
      type: Sequelize.STRING,
    })
    await queryInterface.changeColumn('Speakers', 'snowflake', {
      type: Sequelize.STRING,
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    await queryInterface.changeColumn('DefaultGames', 'snowflake', {
      type: Sequelize.BIGINT,
    })
    await queryInterface.changeColumn('Guilds', 'snowflake', {
      type: Sequelize.BIGINT,
    })
    await queryInterface.changeColumn('Speakers', 'snowflake', {
      type: Sequelize.BIGINT,
    })
  }
};
