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

    /**
     * Find a guild by the guild snowflake in a discord interaction
     * @param  {Interaction}  interaction Discordjs interaction object
     * @param  {Object}       options     Additional options to pass to the findOne() method
     * @return {Promise<Guilds|null>}     Guild object or null
     */
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
