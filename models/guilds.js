"use strict"

const { Model } = require("sequelize")

module.exports = (sequelize, DataTypes) => {
  class Guilds extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Guilds.hasMany(models.Games)
    }

    static async findByInteraction(interaction, options = {}) {
      return Guilds.findOne({
        where: { snowflake: interaction.guildId },
        ...options,
      })
    }
  }
  Guilds.init(
    {
      snowflake: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: "Guilds",
    }
  )
  return Guilds
}
