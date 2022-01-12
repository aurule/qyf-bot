"use strict"

const { Model } = require("sequelize")

module.exports = (sequelize, DataTypes) => {
  class Feedback extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Feedback.belongsTo(models.Users, {
        as: "reporter",
        foreignKey: "reporterId",
      })
      Feedback.hasMany(models.Logs, {
        foreignKey: "loggableId",
        constraints: false,
        scope: {
          loggableType: "Feedback",
        },
      })
    }

    // static "constants" to ensure correct type enum values
    static get TYPE_COMPLAINT() {
      return "complaint"
    }

    static get TYPE_REQUEST() {
      return "request"
    }

    static get TYPE_COMMENT() {
      return "comment"
    }
  }
  Feedback.init(
    {
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM,
        values: [
          Feedback.TYPE_COMPLAINT,
          Feedback.TYPE_REQUEST,
          Feedback.TYPE_COMMENT,
        ],
        allowNull: false,
      },
      status: DataTypes.TEXT,
      reporterId: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: "users",
          },
          key: "id",
        },
      },
    },
    {
      sequelize,
      modelName: "Feedback",
      tableName: "Feedback",
    }
  )
  return Feedback
}
