'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class QuoteEditCodes extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      QuoteEditCodes.belongsTo(models.Quotes, { foreignKey: "quoteId" })
    }
  }
  QuoteEditCodes.init({
    quoteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: {
          tableName: "quotes",
        },
        key: "id",
      },
    },
    shortcode: {
      type: DataTypes.STRING(5),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    }
  }, {
    sequelize,
    modelName: 'QuoteEditCodes',
  });
  return QuoteEditCodes;
};
