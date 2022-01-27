"use strict"

const { Model } = require("sequelize")

module.exports = (sequelize, DataTypes) => {
  class Users extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Users.hasMany(models.Lines, { foreignKey: "speakerId" })
      Users.hasMany(models.Quotes, { foreignKey: "quoterId" })
      Users.hasMany(models.Feedback, { foreignKey: "reporterId" })
      Users.hasMany(models.Bans, {
        foreignKey: "bannableId",
        constraints: false,
        scope: {
          bannableType: "Users",
        },
      })
      Users.belongsToMany(models.Guilds, { through: models.Participations, foreignKey: "userId" })
    }

    /**
     * Find a user by an explicit snowflake
     * @param  {String} snowflake     Snowflake value
     * @param  {Object} options       Additional options to pass to the findOne() method
     * @return {Promise<Users|null>} User object or null
     */
    static async findBySnowflake(snowflake, options = {}) {
      if (!snowflake) return null

      return Users.findOne({
        where: { snowflake: snowflake },
        ...options,
      })
    }
  }
  Users.init(
    {
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      snowflake: {
        type: DataTypes.STRING,
        unique: true,
      },
    },
    {
      sequelize,
      modelName: "Users",
    }
  )
  return Users
}
