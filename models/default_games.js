"use strict"

const { Model } = require("sequelize")

module.exports = (sequelize, DataTypes) => {
  class DefaultGames extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DefaultGames.belongsTo(models.Games, { foreignKey: "gameId" })
    }

    // static "constants" to ensure correct type enum values
    static get TYPE_GUILD() {
      return "guild"
    }
    static get TYPE_CHANNEL() {
      return "channel"
    }
  }
  DefaultGames.init(
    {
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM,
        values: [DefaultGames.TYPE_CHANNEL, DefaultGames.TYPE_GUILD],
        allowNull: false,
      },
      gameId: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: "games",
          },
          key: "id",
        },
      },
      snowflake: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "DefaultGames",
    }
  )
  return DefaultGames
}
