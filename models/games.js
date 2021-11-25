"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Games extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Games.belongsTo(models.Guilds);
      Games.hasMany(models.Quotes);
      Games.hasMany(models.DefaultGames);
    }
  }
  Games.init(
    {
      name: {
        allowNull: false,
        type: DataTypes.TEXT,
      },
      guildId: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: "guilds",
          },
          key: "id",
        },
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Games",
      indexes: [
        {
          unique: true,
          fields: ["name", "guildId"],
        },
      ],
    }
  );
  return Games;
};
