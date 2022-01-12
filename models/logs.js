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
      Logs.belongsTo(models.Feedback, { foreignKey: "loggableId", constraints: false })
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
          if (instance.loggableType === "Feedback" && instance.Feedback !== undefined) {
            instance.loggable = instance.Feedback
          }

          // to prevent mistakes
          delete instance.Feedback
          delete instance.dataValues.Feedback
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
