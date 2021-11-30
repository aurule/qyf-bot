"use strict"

const { Model } = require("sequelize")

module.exports = (sequelize, DataTypes) => {
  class Speakers extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Speakers.hasMany(models.Lines)
    }
  }
  Speakers.init(
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
      modelName: "Speakers",
    }
  )
  return Speakers
}
