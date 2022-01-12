"use strict"

const fs = require("fs")
const path = require("path")
const Sequelize = require("sequelize")
const basename = path.basename(__filename)
const env = process.env.NODE_ENV || "development"
const config_file = require(__dirname + "/../.sequelizerc").config
const config = require(config_file)[env]
const db = {}

const { jsNoTests, noDotFiles } = require("../util/filters")

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
)

fs.readdirSync(__dirname)
  .filter(jsNoTests)
  .filter(noDotFiles)
  .filter((file) => {
    return (
      file !== basename
    )
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    )

    /**
     * Helper to destroy records by their IDs
     *
     * This just calls destroy using a pre-build where clause. It's a convenience
     * method to cut down on clutter for this common use.
     *
     * @param  {Array<Int>} ids Array of primary key values of the records to destroy
     * @return {Promise}
     */
    model.destroyByPk = async (ids) => {
      return model.destroy({where: {id: ids}})
    }
    db[model.name] = model
  })

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db)
  }
  if (db[modelName].hook) {
    db[modelName].hook(db)
  }
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
