"use strict"

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("QuoteEditCodes", {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      quoteId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: {
            tableName: "Quotes",
          },
          key: "id",
        },
      },
      shortcode: {
        allowNull: false,
        type: Sequelize.STRING(5),
        unique: true,
      },
      expiresAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable("QuoteEditCodes")
  },
}
