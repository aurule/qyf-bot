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
    host: "localhost",
    port: 5432,
    dialect: "postgres",
  },
  production: {
    ...global_options,
    username: "postgres",
    password: "postgres",
    database: "database_production",
    host: "127.0.0.1",
    port: 5432,
    dialect: "postgres",
  }
}
