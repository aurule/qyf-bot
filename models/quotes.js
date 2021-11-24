'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Quotes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Quotes.belongsTo(models.Games);
      Quotes.hasMany(models.Lines);
    }
  };
  Quotes.init({
    context: DataTypes.TEXT,
    saidAt: DataTypes.DATE,
    gameId: {
      type: DataTypes.INTEGER,
      references: {
        model: {
          tableName: 'games'
        },
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Quotes',
  });
  return Quotes;
};
