const models = require("../models");

module.exports = {
  truncate: async () => {
    if (process.env.NODE_ENV != "test") {
      console.log(`Bad! Env is ${process.env.NODE_ENV}!`)
      throw new Error("Truncate can only be run in the test env!");
    }
    return await Promise.all(
      Object.keys(models).map((key) => {
        if (["sequelize", "Sequelize"].includes(key)) return null;
        return models[key].destroy({ where: {}, force: true });
      })
    );
  },
};
