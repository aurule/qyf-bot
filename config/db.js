require("dotenv").config()

const { logger } = require("../util/logger")

const global_options = {
  logging: (msg) => logger.debug(msg)
}

module.exports = {
  global_options,
  development: {
    ...global_options,
    username: "root",
    password: null,
    database: "development",
    dialect: "sqlite",
    storage: ".sqlite/development.sqlite",
    transactionType: "IMMEDIATE",
  },
  test: {
    ...global_options,
    username: "root",
    password: null,
    database: "test",
    dialect: "sqlite",
    storage: ".sqlite/test.sqlite",
    transactionType: "IMMEDIATE",
  },
  ci: {
    ...global_options,
    username: "postgres",
    password: "postgres",
    database: "postgres",
    host: "postgres",
    port: 5432,
    dialect: "postgres",
    transactionType: "IMMEDIATE",
  },
  production: {
    ...global_options,
    username: "postgres",
    password: process.env.DB_PW,
    database: "postgres",
    host: process.env.DB_HOST,
    port: 5432,
    dialect: "postgres",
  }
}
