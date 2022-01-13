"use strict"

const { Model, Op } = require("sequelize")

const { forceArray } = require("../util/force-array")

module.exports = (sequelize, DataTypes) => {
  class Bans extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Bans.belongsTo(models.Users, {
        foreignKey: "bannableId",
        constraints: false,
      })
      Bans.belongsTo(models.Guilds, {
        foreignKey: "bannableId",
        constraints: false,
      })
      Bans.hasMany(models.Logs, {
        foreignKey: "loggableId",
        constraints: false,
        scope: {
          loggableType: "Bans",
        },
      })
    }

    /**
     * Helper method for defining hooks.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static hook(models) {
      Bans.addHook("afterFind", (findResult) => {
        findResult = forceArray(findResult)
        for (const instance of findResult) {
          switch (instance.bannableType) {
            case "Users":
              if (instance.Users === undefined) break
              instance.bannable = instance.Users
              break
            case "Guilds":
              if (instance.Guilds === undefined) break
              instance.bannable = instance.Guilds
              break
          }

          // to prevent mistakes
          delete instance.Users
          delete instance.dataValues.Users
          delete instance.Guilds
          delete instance.dataValues.Guilds
        }
      })
    }

    /**
     * Get the correct polymorphic bannable instance for this ban
     *
     * @param  {Object} options   Sequelize options, like where and include
     * @return {Promise<record>}  Promise resolving to the bannable record for this ban
     */
    getBannable(options) {
      if (!this.bannableType) return Promise.resolve(null)
      const mixinMethodName = `get${uppercaseFirst(this.bannableType)}`
      return this[mixinMethodName](options)
    }
  }
  Bans.init(
    {
      reason: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      bannableType: DataTypes.STRING,
      bannableId: DataTypes.INTEGER,
      expiresAt: DataTypes.DATE,
      active: {
        type: new DataTypes.VIRTUAL(DataTypes.BOOLEAN, ['expiresAt']),
        get() {
          return this.get("expiresAt") >= Date.now()
        },
        set(value) {
          throw new Error("Do not try to set the `active` value!")
        }
      }
    },
    {
      scopes: {
        active: {
          where: {
            expiresAt: {
              [Op.or]: {
                [Op.eq]: null,
                [Op.gte]: Date.now(),
              },
            },
          },
        },
        expired: {
          where: {
            expiresAt: {
              [Op.ne]: null,
              [Op.lt]: Date.now(),
            },
          },
        },
      },
      sequelize,
      modelName: "Bans",
    }
  )
  return Bans
}
