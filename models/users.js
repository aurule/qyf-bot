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
