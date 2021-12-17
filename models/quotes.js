"use strict"

const { Model } = require("sequelize")
const { Op } = require("sequelize")
const { subMinutes } = require('date-fns')

module.exports = (sequelize, DataTypes) => {
  class Quotes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Quotes.belongsTo(models.Games)
      Quotes.hasMany(models.Lines)
      Quotes.belongsTo(models.Users, { as: "quoter", foreignKey: "quoterId" })
    }

    /**
     * Find the most recent quote reported by the user, last altered within 15 minutes
     * @param  {Users}  user          The quoter
     * @param  {Object} options       Additional options to pass to the findOne() method
     * @return {Promise<Quotes|null>} Promise resolving to the quote, or null
     */
    static async findLastEditable(user, options = {}) {
      return Quotes.findOne({
        where: {
          quoterId: user.id,
          updatedAt: {
            [Op.gte]: subMinutes(new Date(), 15),
          },
        },
        ...options,
      })
    }
  }
  Quotes.init(
    {
      context: DataTypes.TEXT,
      saidAt: DataTypes.DATE,
      gameId: {
        type: DataTypes.INTEGER,
        references: {
          model: {
            tableName: "games",
          },
          key: "id",
        },
      },
      quoterId: {
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
      modelName: "Quotes",
    }
  )
  return Quotes
}
