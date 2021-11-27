'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Guilds extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Guilds.hasMany(models.Games);
    }

    static async findByInteraction(interaction) {
      return Guilds.findOne({
        where: { snowflake: interaction.guild.id },
      });
    }
  };
  Guilds.init({
    snowflake: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Guilds',
  });
  return Guilds;
};
