"use strict"

const { Model } = require("sequelize")

module.exports = (sequelize, DataTypes) => {
  class Participations extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Participations.belongsTo(models.Users, { foreignKey: "userId" })
      Participations.belongsTo(models.Guilds, { foreignKey: "guildId" })
    }
  }
  Participations.init(
    {
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
      userId: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: "users",
          },
          key: "id",
        },
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Participations",
    }
  )
  return Participations
}
