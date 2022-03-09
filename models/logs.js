"use strict"

const { Model } = require("sequelize")

const { forceArray } = require("../util/force-array")

module.exports = (sequelize, DataTypes) => {
  class Logs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Logs.belongsTo(models.Feedback, {
        foreignKey: "loggableId",
        constraints: false,
      })
      Logs.belongsTo(models.Bans, {
        foreignKey: "loggableId",
        constraints: false,
      })
      Logs.belongsTo(models.Quotes, {
        foreignKey: "loggableId",
        constraints: false,
      })
      Logs.belongsTo(models.Lines, {
        foreignKey: "loggableId",
        constraints: false,
      })
    }

    /**
     * Helper method for defining hooks.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static hook(models) {
      Logs.addHook("afterFind", (findResult) => {
        findResult = forceArray(findResult)
        for (const instance of findResult) {
          switch (instance.loggableType) {
            case "Feedback":
              if (instance.Feedback === undefined) break
              instance.loggable = instance.Feedback
              break
            case "Bans":
              if (instance.Bans === undefined) break
              instance.loggable = instance.Bans
              break
            case "Quotes":
              if (instance.Quotes === undefined) break
              instance.loggable = instance.Quotes
              break
            case "Lines":
              if (instance.Lines === undefined) break
              instance.loggable = instance.Lines
              break
          }

          // to prevent mistakes
          delete instance.Feedback
          delete instance.dataValues.Feedback
          delete instance.Bans
          delete instance.dataValues.Bans
          delete instance.Quotes
          delete instance.dataValues.Quotes
          delete instance.Lines
          delete instance.dataValues.Lines
        }
      })
    }

    /**
     * Get the correct polymorphic loggable instance for this log
     *
     * @param  {Object} options   Sequelize options, like where and include
     * @return {Promise<record>}  Promise resolving to the loggable record for this log
     */
    getLoggable(options) {
      if (!this.loggableType) return Promise.resolve(null)
      const mixinMethodName = `get${uppercaseFirst(this.loggableType)}`
      return this[mixinMethodName](options)
    }
  }
  Logs.init(
    {
      message: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      loggableType: DataTypes.STRING,
      loggableId: DataTypes.INTEGER,
    },
    {
      sequelize,
      modelName: "Logs",
    }
  )
  return Logs
}
