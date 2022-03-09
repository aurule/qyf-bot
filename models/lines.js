"use strict"

const { Model } = require("sequelize")

module.exports = (sequelize, DataTypes) => {
  class Lines extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Lines.belongsTo(models.Quotes, { foreignKey: "quoteId" })
      Lines.belongsTo(models.Users, { as: "speaker", foreignKey: "speakerId" })
      Lines.hasMany(models.Logs, {
        foreignKey: "loggableId",
        constraints: false,
        scope: {
          loggableType: "Lines",
        },
      })
    }
  }
  Lines.init(
    {
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      speakerId: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: "users",
          },
          key: "id",
        },
      },
      speakerAlias: DataTypes.TEXT,
      quoteId: {
        // This is allowed to be null in validation, but has a NOT NULL
        // constraint in the database. This allows lines to be created alongside
        // quotes in one step.
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: "quotes",
          },
          key: "id",
        },
      },
      lineOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Lines",
    }
  )
  return Lines
}
