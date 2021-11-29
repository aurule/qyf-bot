'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.changeColumn('DefaultGames', 'snowflake', {
          type: Sequelize.STRING,
        }, { t }),
        queryInterface.changeColumn('Guilds', 'snowflake', {
          type: Sequelize.STRING,
        }, { t }),
        queryInterface.changeColumn('Speakers', 'snowflake', {
          type: Sequelize.STRING,
        }, { t }),
      ])
    })
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        queryInterface.changeColumn('DefaultGames', 'snowflake', {
          type: Sequelize.BIGINT,
        }, { t }),
        queryInterface.changeColumn('Guilds', 'snowflake', {
          type: Sequelize.BIGINT,
        }, { t }),
        queryInterface.changeColumn('Speakers', 'snowflake', {
          type: Sequelize.BIGINT,
        }, { t }),
      ])
    })
  }
};
