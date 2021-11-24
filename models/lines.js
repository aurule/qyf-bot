'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Lines extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Lines.belongsTo(models.Quotes);
      Lines.belongsTo(models.Speakers);
    }
  };
  Lines.init({
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    speakerId: {
      type: DataTypes.INTEGER,
      references: {
        model: {
          tableName: 'speakers'
        },
        key: 'id'
      }
    },
    speakerAlias: DataTypes.TEXT,
    quoteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: {
          tableName: 'quotes'
        },
        key: 'id'
      }
    },
    lineOrder: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'Lines',
  });
  return Lines;
};
