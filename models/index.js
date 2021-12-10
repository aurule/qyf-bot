"use strict"

const fs = require("fs")
const path = require("path")
const Sequelize = require("sequelize")
const basename = path.basename(__filename)
const env = process.env.NODE_ENV || "development"
const { logger } = require("../util/logger")
const config = require(__dirname + "/../config/config.json")[env]
const db = {}

config.logging = (msg) => logger.debug(msg)

let sequelize
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config)
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config
  )
}

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
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
})

db.sequelize = sequelize
db.Sequelize = Sequelize

module.exports = db
