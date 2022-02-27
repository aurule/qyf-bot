"use strict"

const { Model } = require("sequelize")
const { Op } = require("sequelize")

module.exports = (sequelize, DataTypes) => {
  class Guilds extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Guilds.hasMany(models.Games, { foreignKey: "guildId" })
      Guilds.hasMany(models.Bans, {
        foreignKey: "bannableId",
        constraints: false,
        scope: {
          bannableType: "Guilds",
        },
      })
      Guilds.belongsToMany(models.Users, { through: models.Participations, foreignKey: "guildId" })
    }

    /**
     * Find a guild by an explicit snowflake
     * @param  {String} snowflake     Snowflake value
     * @param  {Object} options       Additional options to pass to the findOne() method
     * @return {Promise<Guilds|null>} Guild object or null
     */
    static findBySnowflake(snowflake, options = {}) {
      if (!snowflake) return null

      return Guilds.findOne({
        where: { snowflake: snowflake },
        ...options,
      })
    }

    /**
     * Find a guild by the guild snowflake in a discord interaction
     * @param  {Interaction}  interaction Discordjs interaction object
     * @param  {Object}       options     Additional options to pass to the findOne() method
     * @return {Promise<Guilds|null>}     Guild object or null
     */
    static findByInteraction(interaction, options = {}) {
      return Guilds.findBySnowflake(interaction.guildId, options)
    }

    /**
     * Get associated games that match a partial or full name
     *
     * Compares game names using ilike when available, otherwise uses like.
     *
     * @param  {string}       gameName Partial game name to match
     * @return {Promise<Array<Games>>}          Array of game objects whose name matches
     */
    getGamesByPartialName(gameName) {
      const comparator = sequelize.options.dialect == "postgres" ? Op.iLike : Op.like

      return this.getGames({ where: { name: { [comparator]: `%${gameName}%` } } })
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
