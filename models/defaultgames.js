'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DefaultGames extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      DefaultGames.belongsTo(models.Games);
    }
  };
  DefaultGames.init({
    name: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM,
      values: ['channel', 'guild'],
      allowNull: false
    },
    gameId: {
      type: DataTypes.INTEGER,
      references: {
        model: {
          tableName: 'games'
        },
        key: 'id'
      },
    },
    snowflake: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: true
    }
  }, {
    sequelize,
    modelName: 'DefaultGames',
  });
  return DefaultGames;
};
